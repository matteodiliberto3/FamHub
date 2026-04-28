// @ts-nocheck
import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryDotColors = {
  scuola: 'bg-blue-500',
  sport: 'bg-green-500',
  medico: 'bg-red-500',
  lavoro: 'bg-purple-500',
  famiglia: 'bg-amber-500',
  altro: 'bg-gray-400',
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function CalendarGrid({ currentMonth, events, onDayClick, selectedDay }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (d) => events.filter(e => isSameDay(new Date(e.date), d));

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {days.map((d, i) => {
          const dayEvents = getEventsForDay(d);
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isSelected = selectedDay && isSameDay(d, selectedDay);
          const todayDay = isToday(d);

          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              className={cn(
                'min-h-[80px] p-1.5 cursor-pointer transition-colors bg-card',
                !isCurrentMonth && 'bg-muted/30',
                isSelected && 'bg-primary/5',
                'hover:bg-muted/60'
              )}
            >
              <div className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto',
                todayDay && 'bg-primary text-primary-foreground',
                !todayDay && isCurrentMonth && 'text-foreground',
                !isCurrentMonth && 'text-muted-foreground/40'
              )}>
                {format(d, 'd')}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', categoryDotColors[event.category] || categoryDotColors.altro)} />
                    <span className="truncate text-foreground/80 leading-tight">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

