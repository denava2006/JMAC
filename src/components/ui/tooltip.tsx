import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>
export type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content>

export function TooltipContent({ className, sideOffset = 4, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          // Inverted on purpose: a tooltip reads as an annotation floating
          // above the page, not another card sitting on it.
          'z-popover overflow-hidden rounded-sm bg-primary px-2 py-1',
          'text-xs text-primary-foreground shadow-md',
          'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'duration-150',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
