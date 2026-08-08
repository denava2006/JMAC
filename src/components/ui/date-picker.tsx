import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  /** Sets aria-invalid and the error border, matching Input and Textarea, so
   *  a form field looks the same whatever control it wraps. */
  invalid?: boolean
  disabled?: boolean
  /** Passed to date-fns. Defaults to a spelled-out month, because 03/04/2026
   *  is a different date depending on where the reader is from. */
  dateFormat?: string
  /** Earliest selectable day; anything before it is disabled in the calendar
   *  and cannot be typed. Pass `new Date()` to forbid past dates. */
  minDate?: Date
  /** Latest selectable day; anything after it is disabled. */
  maxDate?: Date
  id?: string
  className?: string
}

/** react-day-picker's `before`/`after` matchers are exclusive of the boundary
 *  day itself, so a minDate of today must disable everything strictly before
 *  today — which keeps today selectable. Normalised to local midnight so the
 *  current day is never half-disabled by a time component. */
export function dayMatchers(minDate?: Date, maxDate?: Date) {
  const matchers = []
  if (minDate) {
    const floor = new Date(minDate)
    floor.setHours(0, 0, 0, 0)
    matchers.push({ before: floor })
  }
  if (maxDate) {
    const ceil = new Date(maxDate)
    ceil.setHours(0, 0, 0, 0)
    matchers.push({ after: ceil })
  }
  return matchers.length > 0 ? matchers : undefined
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  invalid,
  disabled,
  dateFormat = 'd MMMM yyyy',
  minDate,
  maxDate,
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const disabledDays = dayMatchers(minDate, maxDate)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
            invalid && 'border-error',
            className
          )}
        >
          <CalendarIcon aria-hidden="true" />
          {value ? format(value, dateFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          disabled={disabledDays}
          onSelect={(date) => {
            onChange?.(date)
            // Closing on pick is the whole point of a single-date picker;
            // leaving it open makes every caller wire an onOpenChange.
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
