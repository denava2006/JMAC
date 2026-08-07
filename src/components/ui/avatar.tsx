import * as AvatarPrimitive from '@radix-ui/react-avatar'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root>
export type AvatarImageProps = ComponentProps<typeof AvatarPrimitive.Image>
export type AvatarFallbackProps = ComponentProps<typeof AvatarPrimitive.Fallback>

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

export function AvatarImage({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} {...props} />
  )
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted',
        // text-heading for the same WCAG AA reason as Badge's neutral variant:
        // muted-foreground on a muted surface measures 4.34:1, under 4.5:1.
        'text-xs font-medium text-heading',
        className
      )}
      {...props}
    />
  )
}
