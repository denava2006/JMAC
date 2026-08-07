import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

export type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>
export type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>

export function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // z-popover, above the modal layer: a date picker opened from inside
          // a dialog must sit over it, not behind it.
          'z-popover w-72 rounded-md border border-border bg-surface p-4 shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-150',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
