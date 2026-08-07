import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import type { ComponentProps } from 'react'
import { focusRing } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />
}

export type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'aspect-square size-4 rounded-full border border-input bg-surface',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary',
        focusRing,
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-2 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
