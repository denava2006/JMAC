import { useQuery } from '@tanstack/react-query'
import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  EMPLOYMENT_TYPE_LABEL,
  fetchOpenPositions,
  isAcceptingApplications,
  openPositionsQueryKey,
  type PublicJobPosting,
} from '@/services/careers'

function PositionCard({ posting }: { posting: PublicJobPosting }) {
  const accepting = isAcceptingApplications(posting)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-heading">{posting.title}</h3>
            <Badge variant={accepting ? 'success' : 'neutral'}>
              {accepting ? 'Accepting applications' : 'Closed'}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
            {posting.department ? (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-3.5" aria-hidden="true" />
                {posting.department}
              </span>
            ) : null}
            <span>{EMPLOYMENT_TYPE_LABEL[posting.employmentType] ?? posting.employmentType}</span>
            <span className="tabular">
              {posting.vacancies} {posting.vacancies === 1 ? 'opening' : 'openings'}
            </span>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm" className="shrink-0">
          <Link to={`/careers/${posting.id}`}>View role</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function OpenPositions() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: openPositionsQueryKey,
    queryFn: fetchOpenPositions,
    staleTime: 60_000,
  })

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3 p-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load open positions"
        description="The careers list is temporarily unavailable. Please try again."
        onRetry={() => void refetch()}
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase />}
        title="No open positions right now"
        description="New roles are published here as soon as they open. Check back soon."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((posting) => (
        <PositionCard key={posting.id} posting={posting} />
      ))}
    </div>
  )
}
