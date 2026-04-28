// @ts-nocheck
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Check, X, Palmtree, GraduationCap, Tent, HelpCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const typeConfig = {
  vacanza: { label: 'Vacanza', icon: Palmtree, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  gita_scolastica: { label: 'Gita Scolastica', icon: GraduationCap, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  campo_estivo: { label: 'Campo Estivo', icon: Tent, color: 'bg-green-50 text-green-600 border-green-200' },
  altro: { label: 'Altro', icon: HelpCircle, color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const statusStyles = {
  in_attesa: 'bg-amber-50 text-amber-600 border-amber-200',
  approvato: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rifiutato: 'bg-red-50 text-red-500 border-red-200',
};

export default function BudgetRequests() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'vacanza', amount: '', date_from: '', date_to: '', requested_by: '' });
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.BudgetRequest.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BudgetRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setOpen(false); setForm({ title: '', description: '', type: 'vacanza', amount: '', date_from: '', date_to: '', requested_by: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BudgetRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="space-y-6 section-stagger">
      <PageHeader
        title="Budget & Gite"
        subtitle="Richieste di budget per vacanze, gite e attività"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nuova Richiesta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Richiesta Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Titolo</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Descrizione</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Importo richiesto (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data inizio</Label><Input type="date" value={form.date_from} onChange={e => setForm({ ...form, date_from: e.target.value })} /></div>
                  <div><Label>Data fine</Label><Input type="date" value={form.date_to} onChange={e => setForm({ ...form, date_to: e.target.value })} /></div>
                </div>
                <div><Label>Richiesto da</Label><Input value={form.requested_by} onChange={e => setForm({ ...form, requested_by: e.target.value })} placeholder="Nome" /></div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>Invia Richiesta</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Caricamento...</p>
      ) : budgets.length === 0 ? (
        <Card className="p-12 text-center border-border/50">
          <Palmtree className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Nessuna richiesta di budget ancora</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map(budget => {
            const type = typeConfig[budget.type] || typeConfig.altro;
            const TypeIcon = type.icon;
            return (
              <Card key={budget.id} className="p-5 border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${type.color.split(' ')[0]}`}>
                    <TypeIcon className={`w-5 h-5 ${type.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{budget.title}</h3>
                      <Badge variant="outline" className={`text-xs ${statusStyles[budget.status] || ''}`}>
                        {budget.status === 'in_attesa' ? 'In attesa' : budget.status === 'approvato' ? 'Approvato' : 'Rifiutato'}
                      </Badge>
                    </div>
                    {budget.description && <p className="text-sm text-muted-foreground mb-2">{budget.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground text-sm">€{budget.amount?.toLocaleString('it-IT')}</span>
                      {budget.requested_by && <span>👤 {budget.requested_by}</span>}
                      {budget.date_from && <span>📅 {format(new Date(budget.date_from), 'd MMM', { locale: it })}{budget.date_to ? ` - ${format(new Date(budget.date_to), 'd MMM yy', { locale: it })}` : ''}</span>}
                    </div>
                    {budget.parent_notes && <p className="text-xs text-muted-foreground italic mt-2">Note: "{budget.parent_notes}"</p>}

                    {budget.status === 'in_attesa' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateMutation.mutate({ id: budget.id, data: { status: 'approvato' } })}>
                          <Check className="w-3 h-3 mr-1" />Approva
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => updateMutation.mutate({ id: budget.id, data: { status: 'rifiutato' } })}>
                          <X className="w-3 h-3 mr-1" />Rifiuta
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

