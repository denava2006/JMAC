import * as React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Check, CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SuccessState {
  jobTitle?: string
  referenceCode?: string
  email?: string
}

export function ApplicationSuccessPage() {
  const location = useLocation()
  const state = (location.state ?? {}) as SuccessState
  const [copied, setCopied] = React.useState(false)

  // Reached directly (refresh, bookmark, shared link) there is nothing to show
  // — the reference code only lives in the navigation state from the form.
  if (!state.referenceCode) {
    return <Navigate to="/careers" replace />
  }

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(state.referenceCode as string)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the code is
      // on screen to copy by hand, so a failure here needs no message.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-heading">Application submitted</h1>
        <p className="mt-3 max-w-md text-body">
          Thanks for applying{state.jobTitle ? <> for <span className="font-medium text-heading">{state.jobTitle}</span></> : null}.
          Our HR team will review your application and reach out via the email you provided.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4 p-6">
          <div>
            <p className="text-sm font-medium text-heading">Your reference number</p>
            <p className="mt-1 text-sm text-body">
              Save this. You&rsquo;ll need it — together with your email — to check your application status.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-4 py-3">
            <span className="font-mono text-lg font-semibold tracking-wide text-heading">{state.referenceCode}</span>
            <Button type="button" variant="secondary" size="sm" onClick={copyReference}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {state.email && (
            <p className="text-sm text-muted-foreground">
              Confirmation and updates go to <span className="font-medium text-heading">{state.email}</span>.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/careers/track" state={{ referenceCode: state.referenceCode, email: state.email }}>
            Track this application
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/careers">Browse more roles</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
