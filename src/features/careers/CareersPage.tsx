import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { Loader } from '@/components/ui/loader'
import { OpenPositions } from '@/features/careers/OpenPositions'
import {
  EMPLOYMENT_TYPE_LABEL,
  fetchOpenPosition,
  isAcceptingApplications,
  openPositionsQueryKey,
} from '@/services/careers'

export function CareersPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Breadcrumb items={[{ label: 'JMAC', href: '/' }, { label: 'Careers' }]} />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-heading">
        Work at JMAC
      </h1>
      <p className="mt-3 max-w-2xl text-body">
        Every role below is live from our recruitment system. Applications open and close
        here, not in a separate inbox.
      </p>
      <Link
        to="/careers/track"
        className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
      >
        Already applied? Track your application
      </Link>
      <div className="mt-10">
        <OpenPositions />
      </div>
    </div>
  )
}

export function CareerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isPending, isError } = useQuery({
    queryKey: [...openPositionsQueryKey, id],
    queryFn: () => fetchOpenPosition(id as string),
    enabled: Boolean(id),
  })

  if (isPending) {
    return (
      <div className="mx-auto grid max-w-4xl place-items-center px-6 py-24">
        <Loader size="lg" label="Loading this role" />
      </div>
    )
  }

  // A posting that is not open is invisible to anonymous visitors by policy,
  // so "not found" and "no longer open" are the same answer here — and saying
  // so is more honest than a bare 404.
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <ErrorState
          title="This role is no longer listed"
          description="It may have closed or been filled. The current openings are on the careers page."
        />
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/careers">
            <ArrowLeft aria-hidden="true" />
            Back to careers
          </Link>
        </Button>
      </div>
    )
  }

  const accepting = isAcceptingApplications(data)

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Breadcrumb
        items={[{ label: 'JMAC', href: '/' }, { label: 'Careers', href: '/careers' }, { label: data.title }]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-heading">{data.title}</h1>
        <Badge variant={accepting ? 'success' : 'neutral'}>
          {accepting ? 'Accepting applications' : 'Closed'}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-body">
        {data.department ? <span>{data.department}</span> : null}
        <span>{EMPLOYMENT_TYPE_LABEL[data.employmentType] ?? data.employmentType}</span>
        <span className="tabular">
          {data.vacancies} {data.vacancies === 1 ? 'opening' : 'openings'}
        </span>
        {data.closingDate ? <span>Closes {data.closingDate}</span> : null}
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-6 p-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About the role
            </h2>
            <p className="mt-2 whitespace-pre-line text-body">{data.description}</p>
          </section>

          {data.requirements ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Requirements
              </h2>
              <p className="mt-2 whitespace-pre-line text-body">{data.requirements}</p>
            </section>
          ) : null}

          {accepting ? (
            <Button asChild size="lg" className="self-start">
              <Link to={`/careers/${data.id}/apply`}>Apply for this role</Link>
            </Button>
          ) : (
            <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-body">
              This role is no longer accepting applications. Browse our current openings on the
              careers page.
            </p>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="mt-6">
        <Link to="/careers">
          <ArrowLeft aria-hidden="true" />
          Back to careers
        </Link>
      </Button>
    </div>
  )
}
