// @ts-nocheck
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/12 text-primary',
    accent: 'bg-accent/12 text-accent',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-violet-100 text-violet-700',
  };

  return (
    <Card className="group p-5 border-border/70 transition-[transform,box-shadow,border-color] duration-200 ease-out-strong hover:-translate-y-0.5 hover:shadow-[0_10px_26px_hsl(var(--foreground)/0.08)]">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{title}</p>
          <p className="text-3xl leading-none font-semibold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl border border-current/10 transition-transform duration-150 ease-out-strong group-hover:scale-[1.03]', colorMap[color] || colorMap.primary)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

