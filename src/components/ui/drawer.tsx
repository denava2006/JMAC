import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { DialogOverlay } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Built on Radix Dialog rather than a separate library: a drawer is a modal
 *  that enters from an edge, and reusing Dialog means one focus trap, one
 *  escape handler, and one overlay to reason about. The mobile sidebar in
 *  Track 3 is this component. */
export const Drawer = DialogPrimitive.Root
export const DrawerTrigger = DialogPrimitive.Trigger
export const DrawerClose = DialogPrimitive.Close

const drawerVariants = cva(
  cn(
    'fixed z-modal flex flex-col gap-4 border-border bg-surface p-6 shadow-lg',
    'transition ease-in-out',
    'data-[state=open]:animate-in data-[state=open]:duration-200',
    'data-[state=closed]:animate-out data-[state=closed]:duration-150'
  ),
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
)

export interface DrawerContentProps
  extends ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

export function DrawerContent({ className, children, side, ...props }: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content className={cn(drawerVariants({ side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-sm text-body transition-colors',
            'hover:text-heading focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
          )}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />
}

export function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-heading', className)}
      {...props}
    />
  )
}

export function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-body', className)} {...props} />
  )
}

export { drawerVariants }
