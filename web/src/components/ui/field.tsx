import type * as React from 'react'
import { cn } from '@/lib/utils'

export function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="field-group" className={cn('flex w-full flex-col gap-5', className)} {...props} />
  )
}

export function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field" className={cn('flex w-full flex-col gap-1.5', className)} {...props} />
}

export function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="field-label"
      className={cn('text-sm leading-snug font-semibold', className)}
      {...props}
    />
  )
}

export function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset data-slot="field-set" className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props} />
  )
}

export function FieldLegend({ className, ...props }: React.ComponentProps<'legend'>) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('mb-1.5 text-sm leading-snug font-semibold', className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function FieldError({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-error"
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    />
  )
}
