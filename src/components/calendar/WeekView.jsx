import React, { useRef, useEffect } from 'react';
import { addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64;

const categoryColors = {
  scuola: 'bg-blue-100 border-blue-400 text-blue-800',
  sport: 'bg-green-100 border-green-400 text-green-800',
  medico: 'bg-red-100 border-red-400 text-red-800',
  lavoro: 'bg-purple-100 border-purple-400 text-purple-800',
  famiglia: 'bg-amber-100 border-amber-400 text-amber-800',
  altro: 'bg-gray-100 border-gray-400 text-gray-700',
};

function parseMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function WeekView({ weekStart, events, selectedDay, onDayClick }) {
  const scrollRef = useRef(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  const getEventsForDay = (day) => events.filter(e => isSameDay(new Date(e.date), day));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-8 border-b border-border bg-card sticky top-0 z-20">
        <div className="w-14" />
        {days.map((day, i) => {
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);
          return (
            <div
              key={i}
              className="flex flex-col items-center py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onDayClick(day)}
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {day.toLocaleDateString('it-IT', { weekday: 'short' })}
              </span>
              <span className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mt-0.5',
                today && 'bg-primary text-primary-foreground',
                isSelected && !today && 'bg-muted text-foreground ring-2 ring-primary',
                !today && !isSelected && 'text-foreground'
              )}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-8 relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          <div className="col-span-1 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-xs text-muted-foreground/70"
                style={{ top: `${h * HOUR_HEIGHT - 8}px` }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const dayEvents = getEventsForDay(day);
            const todayCol = isToday(day);
            return (
              <div
                key={di}
                className={cn('relative border-l border-border', todayCol && 'bg-primary/3')}
                onClick={() => onDayClick(day)}
              >
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/40"
                    style={{ top: `${h * HOUR_HEIGHT}px` }}
                  />
                ))}

                {todayCol && (
                  <div
                    className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                    style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 -ml-1" />
                    <div className="h-px flex-1 bg-primary" />
                  </div>
                )}

                {dayEvents.map((event, ei) => {
                  const minutes = parseMinutes(event.time);
                  if (minutes === null) {
                    return (
                      <div
                        key={event.id}
                        className={cn('absolute left-0.5 right-0.5 rounded text-xs px-1 py-0.5 border-l-2 truncate z-10', categoryColors[event.category] || categoryColors.altro)}
                        style={{ top: `${ei * 22}px` }}
                        onClick={e => e.stopPropagation()}
                      >
                        {event.title}
                      </div>
                    );
                  }
                  const top = (minutes / 60) * HOUR_HEIGHT;
                  return (
                    <div
                      key={event.id}
                      className={cn('absolute left-0.5 right-0.5 rounded text-xs px-1.5 py-1 border-l-2 z-10 shadow-sm overflow-hidden', categoryColors[event.category] || categoryColors.altro)}
                      style={{ top: `${top}px`, minHeight: '36px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="font-semibold leading-tight truncate">{event.title}</p>
                      <p className="opacity-70 leading-tight">{event.time}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
