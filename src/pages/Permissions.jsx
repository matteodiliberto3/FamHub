import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const statusConfig = {
  in_attesa: { label: 'In attesa', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-200' },
  approvato: { label: 'Approvato', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rifiutato: { label: 'Rifiutato', icon: XCircle, className: 'bg-red-50 text-red-500 border-red-200' },
};

function ApprovalBadge({ status }) {
  const config = statusConfig[status] || statusConfig.in_attesa;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.className} text-xs flex items-center gap-1 w-fit`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export default function Permissions() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ child_name: '', description: '', date: '', time: '', return_time: '', location: '', notes: '' });
  const queryClient = useQueryClient();
  const { data: permissions = [], isLoading } = useQuery({ queryKey: ['permissions'], queryFn: () => base44.entities.PermissionRequest.list('-created_date', 50) });
  const createMutation = useMutation({ mutationFn: (data) => base44.entities.PermissionRequest.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions'] }); setOpen(false); setForm({ child_name: '', description: '', date: '', time: '', return_time: '', location: '', notes: '' }); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.PermissionRequest.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }) });
  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };
  const handleApproval = (perm, parentField, value) => updateMutation.mutate({ id: perm.id, data: { [parentField]: value } });
  const getOverallStatus = (perm) => (perm.parent1_approval === 'rifiutato' || perm.parent2_approval === 'rifiutato') ? 'rifiutato' : (perm.parent1_approval === 'approvato' && perm.parent2_approval === 'approvato') ? 'approvato' : 'in_attesa';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permessi Uscita"
        subtitle="Richieste di uscita con doppio consenso dei genitori"
        action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nuova Richiesta</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuova Richiesta di Uscita</DialogTitle></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div><Label>Nome del figlio/a</Label><Input value={form.child_name} onChange={e => setForm({ ...form, child_name: e.target.value })} required /></div><div><Label>Dove vuole andare</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div><div className="grid grid-cols-2 gap-4"><div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div><div><Label>Luogo</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Orario uscita</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div><div><Label>Orario rientro</Label><Input type="time" value={form.return_time} onChange={e => setForm({ ...form, return_time: e.target.value })} /></div></div><div><Label>Note</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div><Button type="submit" className="w-full" disabled={createMutation.isPending}>Invia Richiesta</Button></form></DialogContent></Dialog>}
      />
      {isLoading ? <p className="text-center text-muted-foreground py-8">Caricamento...</p> : permissions.length === 0 ? <Card className="p-12 text-center border-border/50"><p className="text-muted-foreground">Nessuna richiesta di permesso ancora</p></Card> : (
        <div className="grid gap-4">
          {permissions.map(perm => {
            const overall = getOverallStatus(perm);
            return (
              <Card key={perm.id} className="p-5 border-border/50 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3"><h3 className="font-semibold text-foreground">{perm.child_name}</h3><ApprovalBadge status={overall} /></div>
                    <p className="text-sm text-muted-foreground">{perm.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>📅 {format(new Date(perm.date), 'd MMM yyyy', { locale: it })}</span>{perm.location && <span>📍 {perm.location}</span>}{perm.time && <span>🕐 {perm.time}</span>}{perm.return_time && <span>🔙 {perm.return_time}</span>}</div>
                    {perm.notes && <p className="text-xs text-muted-foreground italic mt-1">"{perm.notes}"</p>}
                  </div>
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">Genitore 1 {perm.parent1_name ? `(${perm.parent1_name})` : ''}</p>{perm.parent1_approval === 'in_attesa' ? <div className="flex gap-2"><Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApproval(perm, 'parent1_approval', 'approvato')}><Check className="w-3 h-3 mr-1" />Approva</Button><Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleApproval(perm, 'parent1_approval', 'rifiutato')}><X className="w-3 h-3 mr-1" />Rifiuta</Button></div> : <ApprovalBadge status={perm.parent1_approval} />}</div>
                    <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">Genitore 2 {perm.parent2_name ? `(${perm.parent2_name})` : ''}</p>{perm.parent2_approval === 'in_attesa' ? <div className="flex gap-2"><Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApproval(perm, 'parent2_approval', 'approvato')}><Check className="w-3 h-3 mr-1" />Approva</Button><Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleApproval(perm, 'parent2_approval', 'rifiutato')}><X className="w-3 h-3 mr-1" />Rifiuta</Button></div> : <ApprovalBadge status={perm.parent2_approval} />}</div>
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
