// @ts-nocheck
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';

const eventCategories = [
  { value: 'scuola', label: 'Scuola', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'sport', label: 'Sport', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  { value: 'medico', label: 'Medico', color: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-500' },
  { value: 'lavoro', label: 'Lavoro', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { value: 'famiglia', label: 'Famiglia', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'altro', label: 'Altro', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getEventHour(event) {
  if (!event.time) return null;
  const [h] = event.time.split(':').map(Number);
  return h;
}

export default function DayPanel({ selectedDay, events, onToggle, onDelete }) {
  if (!selectedDay) return null;

  const getCat = (cat) => eventCategories.find(c => c.value === cat) || eventCategories[5];
  const timedEvents = events.filter(e => e.time);
  const allDayEvents = events.filter(e => !e.time);

  const eventsByHour = {};
  timedEvents.forEach(e => {
    const h = getEventHour(e);
    if (h !== null) {
      if (!eventsByHour[h]) eventsByHour[h] = [];
      eventsByHour[h].push(e);
    }
  });

  const now = new Date();
  const isToday = isSameDay(selectedDay, now);
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  const EventChip = ({ event }) => {
    const cat = getCat(event.category);
    return (
      <div className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 border ${cat.color} mb-1`}>
        <Checkbox
          checked={event.completed}
          onCheckedChange={(checked) => onToggle(event.id, checked)}
          className="mt-0.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-tight ${event.completed ? 'line-through opacity-50' : ''}`}>
            {event.title}
          </p>
          {event.time && <p className="text-xs opacity-70 mt-0.5">{event.time}</p>}
          {event.assigned_to && <p className="text-xs opacity-70">👤 {event.assigned_to}</p>}
        </div>
        <Button
          variant="ghost" size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-1"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-foreground capitalize mb-3 text-sm">
        {format(selectedDay, 'EEEE d MMMM', { locale: it })}
      </h3>

      {allDayEvents.length > 0 && (
        <div className="mb-3 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Tutto il giorno</p>
          {allDayEvents.map(e => <EventChip key={e.id} event={e} />)}
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative" style={{ maxHeight: '520px' }}>
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour} className="flex group/row min-h-[56px]">
              <div className="w-12 flex-shrink-0 pt-0 pr-3 text-right">
                <span className="text-xs text-muted-foreground/70 leading-none" style={{ lineHeight: '1' }}>
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>

              <div className="flex-1 border-t border-border/50 pt-1 pb-1 pl-2 relative min-h-[56px]">
                {isToday && hour === currentHour && (
                  <div
                    className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                    style={{ top: `${(currentMinutes / 60) * 56}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 -ml-1" />
                    <div className="h-px flex-1 bg-primary" />
                  </div>
                )}
                {eventsByHour[hour]?.map(e => <EventChip key={e.id} event={e} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nessun impegno questo giorno</p>
      )}
    </div>
  );
}

