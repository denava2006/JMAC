import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button, Card, CardContent, ErrorState, Input, Label } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginValues = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    // Back to whatever they were trying to reach before the detour.
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/dashboard', { replace: true })
  }

  return (
    <Card>
      <CardContent className="p-6 pt-6">
        <h1 className="text-lg font-semibold text-heading">Sign in to JMAC</h1>
        <p className="mt-1 text-sm text-body">Use your work email address.</p>

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

          <div className="grid gap-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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

          {formError ? (
            <ErrorState title={formError} className="px-4 py-4 text-left" />
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <Link
            to="/forgot-password"
            className="text-center text-sm text-primary-hover underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
