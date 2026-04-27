import React, { useState } from 'react';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryDots = {
  scuola: 'bg-blue-500',
  sport: 'bg-green-500',
  medico: 'bg-red-500',
  lavoro: 'bg-purple-500',
  famiglia: 'bg-amber-500',
  altro: 'bg-gray-400',
};

function getLabel(event) {
  const d = new Date(event.date);
  if (isToday(d)) return 'Oggi';
  if (isTomorrow(d)) return 'Domani';
  const diff = differenceInDays(d, new Date());
  if (diff <= 7) return `Tra ${diff} giorni`;
  return format(d, 'd MMM', { locale: it });
}

export default function UpcomingNotifications({ events }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_events') || '[]'); } catch { return []; }
  });

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed_events', JSON.stringify(next));
  };

  const today = new Date();
  const upcoming = events
    .filter(e => {
      const d = new Date(e.date);
      const diff = differenceInDays(d, today);
      return diff >= 0 && diff <= 3 && !dismissed.includes(e.id);
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Prossimi impegni</span>
      </div>
      {upcoming.map(event => (
        <div key={event.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100 group">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', categoryDots[event.category] || categoryDots.altro)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {getLabel(event)}{event.time ? ` · ${event.time}` : ''}{event.assigned_to ? ` · ${event.assigned_to}` : ''}
            </p>
          </div>
          <button
            onClick={() => dismiss(event.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
