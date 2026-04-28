// @ts-nocheck
import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-9">
      <div className="space-y-1.5">
        <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-base text-muted-foreground leading-relaxed max-w-[58ch]">{subtitle}</p>}
      </div>
      {action && <div className="sm:pb-1">{action}</div>}
    </div>
  );
}

