import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges class names so a caller's `className` reliably overrides a
 * component's defaults, instead of both landing in the class list and
 * letting stylesheet order decide. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
