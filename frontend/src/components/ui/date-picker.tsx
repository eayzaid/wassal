import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface DatePickerProps {
  value?: string; // ISO string e.g. "2026-10-15T18:00" or "2026-10-15"
  onChange: (value: string) => void;
  placeholder?: string;
  includeTime?: boolean;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  includeTime = true,
  disabled = false,
  minDate,
  className,
  label,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse existing value
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const d = parseISO(value);
      return isValid(d) ? d : undefined;
    } catch {
      return undefined;
    }
  }, [value]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(parsedDate);
  const [time, setTime] = React.useState<string>(() => {
    if (parsedDate) {
      const h = String(parsedDate.getHours()).padStart(2, '0');
      const m = String(parsedDate.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '18:00';
  });

  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDate(parsedDate);
      const h = String(parsedDate.getHours()).padStart(2, '0');
      const m = String(parsedDate.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    } else {
      setSelectedDate(undefined);
    }
  }, [value, parsedDate]);

  const emitChange = (date: Date | undefined, timeStr: string) => {
    if (!date) {
      onChange('');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    if (includeTime) {
      onChange(`${dateStr}T${timeStr}:00`);
    } else {
      onChange(dateStr);
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    emitChange(date, time);
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      emitChange(selectedDate, newTime);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    onChange('');
  };

  // Generate 30-min time options
  const timeOptions = React.useMemo(() => {
    const opts: string[] = [];
    for (let h = 8; h <= 23; h++) {
      for (let m = 0; m < 60; m += 30) {
        opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return opts;
  }, []);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-wassal-plum">
          {label}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'w-full h-11 sm:h-10 px-3.5 py-2 rounded-xl border border-wassal-border bg-white text-left font-normal text-xs sm:text-sm flex items-center justify-between transition-colors shadow-xs',
              'hover:border-wassal-slate/40 focus:outline-none focus:ring-2 focus:ring-wassal-green',
              !selectedDate && 'text-wassal-slate',
              selectedDate && 'text-wassal-plum font-medium',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
            )}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <CalendarIcon className="w-4 h-4 text-wassal-slate shrink-0" />
              <span className="truncate">
                {selectedDate ? (
                  includeTime ? (
                    `${format(selectedDate, 'd MMMM yyyy', { locale: fr })} à ${time}`
                  ) : (
                    format(selectedDate, 'd MMMM yyyy', { locale: fr })
                  )
                ) : (
                  placeholder
                )}
              </span>
            </div>

            {selectedDate && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded-md text-wassal-slate hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                title="Effacer"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 border border-wassal-border shadow-xl rounded-2xl bg-white"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            disabled={minDate ? { before: minDate } : undefined}
          />

          {includeTime && selectedDate && (
            <div className="p-3 border-t border-wassal-border flex items-center justify-between gap-3 bg-wassal-bg/40">
              <span className="text-xs font-semibold text-wassal-plum flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-wassal-slate" />
                <span>Heure :</span>
              </span>

              <Select value={time} onValueChange={handleTimeChange}>
                <SelectTrigger className="h-8 w-28 text-xs bg-white text-wassal-plum font-semibold border-wassal-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {timeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-3 text-xs bg-wassal-green-ink text-white font-bold"
              >
                Valider
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
