import type * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-input bg-white px-3 py-2 text-base transition-colors',
        'placeholder:text-muted-foreground focus-visible:border-ring',
        'aria-invalid:border-2 aria-invalid:border-destructive disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
