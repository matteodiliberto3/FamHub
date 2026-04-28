// @ts-nocheck
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HandHeart, CalendarDays, Palmtree, ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/shared/StatCard';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Dashboard() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 50),
  });
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.PermissionRequest.list('-created_date', 10),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.FamilyEvent.list('-date', 10),
  });
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.BudgetRequest.list('-created_date', 10),
  });

  const totalIncome = transactions.filter(t => t.type === 'entrata').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'uscita').reduce((s, t) => s + (t.amount || 0), 0);
  const pendingPermissions = permissions.filter(p => p.parent1_approval === 'in_attesa' || p.parent2_approval === 'in_attesa');
  const pendingBudgets = budgets.filter(b => b.status === 'in_attesa');
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date(new Date().toDateString())).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  return (
    <div className="space-y-8 section-stagger">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Bentornato 👋</h1>
        <p className="text-muted-foreground mt-1">Ecco un riepilogo della tua famiglia</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><StatCard title="Entrate" value={`€${totalIncome.toLocaleString('it-IT')}`} icon={TrendingUp} color="green" /></div>
        <div><StatCard title="Uscite" value={`€${totalExpenses.toLocaleString('it-IT')}`} icon={TrendingDown} color="red" /></div>
        <div><StatCard title="Permessi in attesa" value={pendingPermissions.length} icon={HandHeart} color="accent" /></div>
        <div><StatCard title="Budget in attesa" value={pendingBudgets.length} icon={Palmtree} color="purple" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />Prossimi Impegni</h2>
            <Link to="/calendario" className="text-xs text-primary hover:underline flex items-center gap-1">Vedi tutti <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {upcomingEvents.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Nessun impegno in programma</p> : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><CalendarDays className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'd MMM yyyy', { locale: it })}{event.time && ` · ${event.time}`}</p>
                  </div>
                  {event.category && <Badge variant="secondary" className="text-xs">{event.category}</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><HandHeart className="w-4 h-4 text-accent" />Richieste Permesso</h2>
            <Link to="/permessi" className="text-xs text-primary hover:underline flex items-center gap-1">Vedi tutti <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {pendingPermissions.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Nessuna richiesta in attesa</p> : (
            <div className="space-y-3">
              {pendingPermissions.slice(0, 4).map(perm => (
                <div key={perm.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><Clock className="w-4 h-4 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{perm.child_name} — {perm.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(perm.date), 'd MMM yyyy', { locale: it })}</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-accent border-accent/30">In attesa</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

