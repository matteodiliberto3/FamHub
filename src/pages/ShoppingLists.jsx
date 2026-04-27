import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function ShoppingLists() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const queryClient = useQueryClient();
  const { data: lists = [], isLoading } = useQuery({ queryKey: ['shopping-lists'], queryFn: () => base44.entities.ShoppingList.list('-created_date', 50) });
  const createMutation = useMutation({ mutationFn: (data) => base44.entities.ShoppingList.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shopping-lists'] }); setCreateOpen(false); setNewListName(''); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.ShoppingList.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-lists'] }) });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.ShoppingList.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shopping-lists'] }); setSelectedList(null); } });

  const addItem = (list) => { if (!newItemName.trim()) return; const items = [...(list.items || []), { name: newItemName, quantity: newItemQty, checked: false }]; updateMutation.mutate({ id: list.id, data: { items } }); setNewItemName(''); setNewItemQty(''); };
  const toggleItem = (list, index) => { const items = [...(list.items || [])]; items[index] = { ...items[index], checked: !items[index].checked }; updateMutation.mutate({ id: list.id, data: { items } }); };
  const removeItem = (list, index) => { const items = (list.items || []).filter((_, i) => i !== index); updateMutation.mutate({ id: list.id, data: { items } }); };
  const activeList = lists.find(l => l.id === selectedList?.id) || selectedList;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liste della Spesa"
        subtitle="Liste condivise per tutta la famiglia"
        action={<Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nuova Lista</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuova Lista della Spesa</DialogTitle></DialogHeader><form onSubmit={e => { e.preventDefault(); createMutation.mutate({ name: newListName, items: [], status: 'attiva' }); }} className="space-y-4"><div><Label>Nome della lista</Label><Input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="es. Spesa settimanale" required /></div><Button type="submit" className="w-full" disabled={createMutation.isPending}>Crea Lista</Button></form></DialogContent></Dialog>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {isLoading ? <p className="text-center text-muted-foreground py-4">Caricamento...</p> : lists.length === 0 ? <Card className="p-8 text-center border-border/50"><ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Crea la tua prima lista</p></Card> : lists.map(list => {
            const total = (list.items || []).length;
            const checked = (list.items || []).filter(i => i.checked).length;
            return (
              <Card key={list.id} className={`p-4 cursor-pointer transition-all hover:shadow-md border-border/50 ${activeList?.id === list.id ? 'ring-2 ring-primary shadow-md' : ''}`} onClick={() => setSelectedList(list)}>
                <div className="flex items-center justify-between">
                  <div><h3 className="font-medium text-sm">{list.name}</h3><p className="text-xs text-muted-foreground mt-0.5">{checked}/{total} completati</p></div>
                  <div className="flex items-center gap-2">{list.status === 'completata' && <Badge variant="secondary" className="text-xs">Completata</Badge>}<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(list.id); }}><Trash2 className="w-3 h-3" /></Button></div>
                </div>
                {total > 0 && <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(checked / total) * 100}%` }} /></div>}
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {activeList ? (
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-semibold mb-4">{activeList.name}</h2>
              <div className="flex gap-2 mb-4"><Input placeholder="Aggiungi articolo..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(activeList); } }} /><Input placeholder="Qtà" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} className="w-24" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(activeList); } }} /><Button onClick={() => addItem(activeList)} size="icon"><Plus className="w-4 h-4" /></Button></div>
              <div className="space-y-2">
                {(activeList.items || []).length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Lista vuota, aggiungi qualcosa!</p> : (activeList.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"><Checkbox checked={item.checked} onCheckedChange={() => toggleItem(activeList, idx)} /><span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>{item.quantity && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.quantity}</span>}<Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => removeItem(activeList, idx)}><X className="w-3 h-3" /></Button></div>
                ))}
              </div>
            </Card>
          ) : <Card className="p-12 text-center border-border/50 border-dashed"><ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground">Seleziona una lista per visualizzarla</p></Card>}
        </div>
      </div>
    </div>
  );
}
