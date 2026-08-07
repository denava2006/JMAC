import { Breadcrumb, Card, CardContent, EmptyState } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

/** Placeholder. Phase 2 builds the permission-driven widgets; this exists so
 *  Track 3's layouts, guards, and sidebar have a real destination to land on. */
export function DashboardPage() {
  const { profile, authorization } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Welcome back, {firstName}</h1>
        <p className="mt-1 text-body">
          {authorization.roles.length > 0
            ? `Signed in as ${authorization.roles.map((role) => role.name).join(', ')}.`
            : 'No roles are assigned to your account yet.'}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="Your dashboard is being built"
            description="Widgets appear here in Phase 2, and only the ones your permissions allow."
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>
    </div>
  )
}
