import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button, Card, CardContent, ErrorState, Input, Label } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'The two passwords don’t match.',
    path: ['confirm'],
  })

type ResetValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)

  // Supabase turns the recovery link's URL fragment into a session. Until that
  // has happened there is nobody to change the password for, and rendering the
  // form would collect a new password only to fail on submit.
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasRecoverySession(Boolean(data.session))
    })
    return () => {
      mounted = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: ResetValues) {
    setFormError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setFormError(error.message)
      return
    }
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (hasRecoverySession === false) {
    return (
      <Card>
        <CardContent className="p-6 pt-6">
          <ErrorState
            title="This reset link is no longer valid"
            description="Reset links expire after a short time. Request a new one to continue."
            className="border-0 shadow-none"
          />
          <Link
            to="/forgot-password"
            className="mt-2 block text-center text-sm text-primary-hover underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 pt-6">
        <h1 className="text-lg font-semibold text-heading">Choose a new password</h1>
        <p className="mt-1 text-sm text-body">You’ll sign in with it from now on.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="password" required>
              New password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" className="text-xs text-error">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm" required>
              Confirm new password
            </Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? 'confirm-error' : undefined}
              {...register('confirm')}
            />
            {errors.confirm ? (
              <p id="confirm-error" className="text-xs text-error">
                {errors.confirm.message}
              </p>
            ) : null}
          </div>

          {formError ? <ErrorState title={formError} className="px-4 py-4 text-left" /> : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
