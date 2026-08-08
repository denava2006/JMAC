import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CalendarClock, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { applicantStatusCopy, applicationStatusVariant } from '@/lib/applicationLabels'
import { trackApplication, type TrackedApplication } from '@/services/applications'

interface PrefillState {
  referenceCode?: string
  email?: string
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-heading">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function StatusResult({ application }: { application: TrackedApplication }) {
  const copy = applicantStatusCopy(application.status)
  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <Badge variant={applicationStatusVariant(application.status)}>{copy.label}</Badge>
          {copy.detail ? <p className="text-body">{copy.detail}</p> : null}
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <DetailRow label="Reference" value={<span className="font-mono tabular">{application.referenceCode}</span>} />
          <DetailRow label="Applicant" value={application.applicantName} />
          <DetailRow label="Position" value={application.positionTitle} />
          <DetailRow label="Department" value={application.departmentName} />
          <DetailRow label="Submitted" value={<span className="tabular">{application.submittedAt.slice(0, 10)}</span>} />
        </dl>

        {application.interview ? (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted p-4">
            <div className="flex items-center gap-2 text-heading">
              <CalendarClock className="size-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">Interview</span>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <DetailRow
                label="When"
                value={
                  application.interview.scheduledAt ? (
                    <span className="tabular">{new Date(application.interview.scheduledAt).toLocaleString()}</span>
                  ) : null
                }
              />
              <DetailRow label="Mode" value={application.interview.mode} />
              <DetailRow label="Location" value={application.interview.location} />
              <DetailRow
                label="Link"
                value={
                  application.interview.meetingLink ? (
                    <a
                      href={application.interview.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      Join
                    </a>
                  ) : null
                }
              />
            </dl>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function TrackApplicationPage() {
  const location = useLocation()
  const prefill = (location.state ?? {}) as PrefillState
  const [referenceCode, setReferenceCode] = React.useState(prefill.referenceCode ?? '')
  const [email, setEmail] = React.useState(prefill.email ?? '')

  const lookup = useMutation({ mutationFn: () => trackApplication(referenceCode, email) })

  // Arriving straight from the success page (reference + email in state) looks
  // up the status immediately, so the applicant does not retype what they just
  // submitted.
  const autoRan = React.useRef(false)
  React.useEffect(() => {
    if (!autoRan.current && prefill.referenceCode && prefill.email) {
      autoRan.current = true
      lookup.mutate()
    }
  }, [prefill.referenceCode, prefill.email, lookup])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!referenceCode.trim() || !email.trim()) return
    lookup.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        to="/careers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-heading"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to careers
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-heading">Track your application</h1>
        <p className="mt-3 max-w-lg text-body">
          Enter the reference number from your application confirmation, along with the email you applied with.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reference" required>
                Reference number
              </Label>
              <Input
                id="reference"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="APP-2026-0001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="track-email" required>
                Email address
              </Label>
              <Input
                id="track-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            {lookup.isError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{lookup.error instanceof Error ? lookup.error.message : 'Something went wrong. Please try again.'}</span>
              </div>
            ) : null}

            <Button type="submit" disabled={lookup.isPending || !referenceCode.trim() || !email.trim()}>
              <Search aria-hidden="true" />
              {lookup.isPending ? 'Checking…' : 'Check status'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lookup.data ? <StatusResult application={lookup.data} /> : null}
    </div>
  )
}
