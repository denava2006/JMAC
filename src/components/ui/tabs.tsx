import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { focusRing } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export type TabsProps = ComponentProps<typeof TabsPrimitive.Root>
export type TabsListProps = ComponentProps<typeof TabsPrimitive.List>
export type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger>
export type TabsContentProps = ComponentProps<typeof TabsPrimitive.Content>

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex items-center gap-1 border-b border-border', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        // An underline rather than a filled pill: SAP Fiori and Microsoft 365
        // both mark the active tab with a rule, and it survives a long label
        // that a pill would have to wrap.
        '-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium',
        'text-body transition-colors',
        'hover:text-heading',
        'data-[state=active]:border-primary data-[state=active]:text-heading',
        'disabled:pointer-events-none disabled:opacity-50',
        focusRing,
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return <TabsPrimitive.Content className={cn('pt-4', focusRing, className)} {...props} />
}
