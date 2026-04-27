import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronLeft, ChevronRight, Users, LayoutGrid, CalendarDays, List } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayPanel from '@/components/calendar/DayPanel';
import WeekView from '@/components/calendar/WeekView';
import UpcomingNotifications from '@/components/calendar/UpcomingNotifications';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

const eventCategories = [
  { value: 'scuola', label: 'Scuola' }, { value: 'sport', label: 'Sport' }, { value: 'medico', label: 'Medico' },
  { value: 'lavoro', label: 'Lavoro' }, { value: 'famiglia', label: 'Famiglia' }, { value: 'altro', label: 'Altro' },
];
const VIEWS = [{ id: 'month', label: 'Mese', icon: LayoutGrid }, { id: 'week', label: 'Settimana', icon: CalendarDays }, { id: 'day', label: 'Giorno', icon: List }];

export default function Calendar() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [memberFilter, setMemberFilter] = useState('tutti');
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', category: 'altro', assigned_to: '' });
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.FamilyEvent.list('-date', 200) });
  const createMutation = useMutation({ mutationFn: (data) => base44.entities.FamilyEvent.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setOpen(false); setForm({ title: '', description: '', date: '', time: '', category: 'altro', assigned_to: '' }); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.FamilyEvent.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }) });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.FamilyEvent.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }) });
  const members = useMemo(() => [...new Set(events.map(e => e.assigned_to).filter(Boolean))].sort(), [events]);
  const filteredEvents = useMemo(() => memberFilter === 'tutti' ? events : events.filter(e => e.assigned_to === memberFilter), [events, memberFilter]);
  const dayEvents = useMemo(() => filteredEvents.filter(e => isSameDay(new Date(e.date), selectedDay)), [filteredEvents, selectedDay]);
  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };
  const handleDayClick = (day) => { setSelectedDay(day); setCurrentWeekStart(startOfWeek(day, { weekStartsOn: 1 })); };
  const navigatePrev = () => { if (view === 'month') setCurrentMonth(subMonths(currentMonth, 1)); else if (view === 'week') setCurrentWeekStart(subWeeks(currentWeekStart, 1)); };
  const navigateNext = () => { if (view === 'month') setCurrentMonth(addMonths(currentMonth, 1)); else if (view === 'week') setCurrentWeekStart(addWeeks(currentWeekStart, 1)); };
  const navLabel = () => view === 'month' ? format(currentMonth, 'MMMM yyyy', { locale: it }) : view === 'week' ? `${format(currentWeekStart, 'd MMM', { locale: it })} – ${format(new Date(currentWeekStart.getTime() + 6 * 86400000), 'd MMM yyyy', { locale: it })}` : format(selectedDay, 'EEEE d MMMM yyyy', { locale: it });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendario Famiglia"
        subtitle="Gli impegni di tutta la famiglia"
        action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nuovo Impegno</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuovo Impegno</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Titolo</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div><div><Label>Descrizione</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div><div><Label>Orario</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Categoria</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Assegnato a</Label><Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder="Nome membro" /></div></div><Button type="submit" className="w-full" disabled={createMutation.isPending}>Salva Impegno</Button></form></DialogContent></Dialog>}
      />
      <UpcomingNotifications events={filteredEvents} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap"><Users className="w-4 h-4 text-muted-foreground" /><Button variant={memberFilter === 'tutti' ? 'default' : 'outline'} size="sm" onClick={() => setMemberFilter('tutti')} className="h-8 text-xs">Tutti</Button>{members.map(member => <Button key={member} variant={memberFilter === member ? 'default' : 'outline'} size="sm" onClick={() => setMemberFilter(member)} className="h-8 text-xs">{member}</Button>)}</div>
        <div className="ml-auto flex items-center gap-2"><div className="flex rounded-lg border border-border overflow-hidden">{VIEWS.map(v => { const Icon = v.icon; return <button key={v.id} onClick={() => setView(v.id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === v.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}><Icon className="w-3.5 h-3.5" />{v.label}</button>; })}</div></div>
      </div>
      <div className={view === 'day' ? 'grid grid-cols-1 xl:grid-cols-3 gap-6' : ''}>
        <div className={view === 'day' ? 'xl:col-span-2' : ''}>
          <Card className="border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              {view !== 'day' ? <Button variant="ghost" size="icon" onClick={navigatePrev}><ChevronLeft className="w-4 h-4" /></Button> : <div className="w-8" />}
              <h2 className="text-sm font-semibold capitalize">{navLabel()}</h2>
              {view !== 'day' ? <Button variant="ghost" size="icon" onClick={navigateNext}><ChevronRight className="w-4 h-4" /></Button> : <div className="w-8" />}
            </div>
            {isLoading ? <div className="h-80 flex items-center justify-center text-muted-foreground">Caricamento...</div> : view === 'month' ? <div className="p-3"><CalendarGrid currentMonth={currentMonth} events={filteredEvents} selectedDay={selectedDay} onDayClick={handleDayClick} /></div> : view === 'week' ? <div style={{ height: '600px' }}><WeekView weekStart={currentWeekStart} events={filteredEvents} selectedDay={selectedDay} onDayClick={handleDayClick} /></div> : <div className="p-4" style={{ minHeight: '400px' }}><DayPanel selectedDay={selectedDay} events={dayEvents} onToggle={(id, checked) => updateMutation.mutate({ id, data: { completed: checked } })} onDelete={(id) => deleteMutation.mutate(id)} /></div>}
          </Card>
        </div>
      </div>
      {view === 'month' && <Card className="p-4 border-border/50 xl:hidden"><DayPanel selectedDay={selectedDay} events={dayEvents} onToggle={(id, checked) => updateMutation.mutate({ id, data: { completed: checked } })} onDelete={(id) => deleteMutation.mutate(id)} /></Card>}
    </div>
  );
}
