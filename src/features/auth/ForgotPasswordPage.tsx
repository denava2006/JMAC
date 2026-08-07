import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button, Card, CardContent, EmptyState, Input, Label } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const schema = z.object({ email: z.email('Enter a valid email address.') })
type ForgotValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  async function onSubmit(values: ForgotValues) {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Always reports success, whatever the result. Saying "no such account"
    // turns this form into a way to discover who works here.
    setSent(true)
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="p-6 pt-6">
          <EmptyState
            title="Check your email"
            description="If an account exists for that address, a reset link is on its way."
            className="border-0 shadow-none"
          />
          <Link
            to="/login"
            className="mt-2 block text-center text-sm text-primary-hover underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 pt-6">
        <h1 className="text-lg font-semibold text-heading">Reset your password</h1>
        <p className="mt-1 text-sm text-body">
          We’ll email you a link to choose a new one.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="email-error" className="text-xs text-error">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>

          <Link
            to="/login"
            className="text-center text-sm text-primary-hover underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
