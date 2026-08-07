import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Shared by every interactive component. Kept here rather than duplicated so
 *  a focus-ring change is one edit, not fourteen. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'text-sm font-medium transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    focusRing
  ),
  {
    variants: {
      variant: {
        // Navy -> blue on hover is a hue change, not a shade change. That is
        // what PROJECT_CONTEXT.md specifies; see the token comment in
        // tokens.css if it should become a navy tint instead.
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'border border-border bg-surface text-heading hover:bg-muted',
        ghost: 'text-body hover:bg-muted hover:text-heading',
        destructive: 'bg-error text-error-foreground hover:opacity-90',
        link: 'text-primary-hover underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button>, keeping the styling.
   *  Used for links that should look like buttons. */
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}

export { buttonVariants }
