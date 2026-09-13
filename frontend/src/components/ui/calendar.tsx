import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-white rounded-2xl select-none', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        month_caption: 'flex justify-center pt-1 relative items-center mb-1',
        caption_label: 'text-sm font-bold font-heading text-wassal-plum capitalize',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg border border-wassal-border hover:bg-wassal-bg flex items-center justify-center transition-colors'
        ),
        button_next: cn(
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg border border-wassal-border hover:bg-wassal-bg flex items-center justify-center transition-colors'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex mb-1',
        weekday: 'text-wassal-slate rounded-md w-8 font-semibold text-[0.75rem] text-center capitalize',
        week: 'flex w-full mt-1',
        day: 'h-8 w-8 text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
        day_button: cn(
          'h-8 w-8 p-0 font-medium rounded-lg text-wassal-ink hover:bg-wassal-bg hover:text-wassal-plum transition-colors flex items-center justify-center',
          'aria-selected:opacity-100'
        ),
        selected:
          '!bg-wassal-plum !text-white font-bold hover:!bg-wassal-plum focus:!bg-wassal-plum shadow-xs',
        today: 'border border-wassal-green text-wassal-green-ink font-bold',
        outside: 'text-gray-300 opacity-50',
        disabled: 'text-gray-300 opacity-40 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';
