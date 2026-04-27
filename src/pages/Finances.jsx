import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const categories = [
  { value: 'stipendio', label: 'Stipendio' }, { value: 'bollette', label: 'Bollette' }, { value: 'spesa', label: 'Spesa' },
  { value: 'trasporti', label: 'Trasporti' }, { value: 'salute', label: 'Salute' }, { value: 'istruzione', label: 'Istruzione' },
  { value: 'svago', label: 'Svago' }, { value: 'abbigliamento', label: 'Abbigliamento' }, { value: 'casa', label: 'Casa' }, { value: 'altro', label: 'Altro' },
];

export default function Finances() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: 'uscita', category: 'altro', date: new Date().toISOString().split('T')[0], parent_name: '' });
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useQuery({ queryKey: ['transactions'], queryFn: () => base44.entities.Transaction.list('-date', 100) });
  const createMutation = useMutation({ mutationFn: (data) => base44.entities.Transaction.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setOpen(false); resetForm(); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.Transaction.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }) });
  const resetForm = () => setForm({ description: '', amount: '', type: 'uscita', category: 'altro', date: new Date().toISOString().split('T')[0], parent_name: '' });
  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate({ ...form, amount: parseFloat(form.amount) }); };
  const totalIncome = transactions.filter(t => t.type === 'entrata').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'uscita').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanze Famiglia"
        subtitle="Gestisci entrate e uscite"
        action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nuova Transazione</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuova Transazione</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Descrizione</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div><div className="grid grid-cols-2 gap-4"><div><Label>Importo (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div><div><Label>Tipo</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entrata">Entrata</SelectItem><SelectItem value="uscita">Uscita</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Categoria</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div></div><div><Label>Genitore</Label><Input value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} placeholder="Nome del genitore" /></div><Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvataggio...' : 'Salva Transazione'}</Button></form></DialogContent></Dialog>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Entrate Totali" value={`€${totalIncome.toLocaleString('it-IT')}`} icon={TrendingUp} color="green" />
        <StatCard title="Uscite Totali" value={`€${totalExpenses.toLocaleString('it-IT')}`} icon={TrendingDown} color="red" />
        <StatCard title="Bilancio" value={`€${(totalIncome - totalExpenses).toLocaleString('it-IT')}`} icon={TrendingUp} color="primary" />
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-muted/30"><th className="text-left text-xs font-medium text-muted-foreground p-4">Data</th><th className="text-left text-xs font-medium text-muted-foreground p-4">Descrizione</th><th className="text-left text-xs font-medium text-muted-foreground p-4">Categoria</th><th className="text-left text-xs font-medium text-muted-foreground p-4">Genitore</th><th className="text-right text-xs font-medium text-muted-foreground p-4">Importo</th><th className="text-right text-xs font-medium text-muted-foreground p-4"></th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Caricamento...</td></tr> : transactions.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nessuna transazione registrata</td></tr> : transactions.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-4 text-sm">{format(new Date(t.date), 'd MMM yy', { locale: it })}</td>
                  <td className="p-4 text-sm font-medium">{t.description}</td>
                  <td className="p-4"><Badge variant="secondary" className="text-xs">{categories.find(c => c.value === t.category)?.label || t.category}</Badge></td>
                  <td className="p-4 text-sm text-muted-foreground">{t.parent_name || '—'}</td>
                  <td className={`p-4 text-sm font-semibold text-right ${t.type === 'entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'entrata' ? '+' : '-'}€{t.amount?.toLocaleString('it-IT')}</td>
                  <td className="p-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
