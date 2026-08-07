import {
  BarChart3,
  Boxes,
  CalendarClock,
  Layers,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

interface Feature {
  icon: ReactNode
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: <ShieldCheck />,
    title: 'One sign-in, real permissions',
    description:
      'Roles and permissions live in the database, not in the interface. What a person can see and what they can do are decided in the same place.',
  },
  {
    icon: <UserCheck />,
    title: 'Hired once, deployed everywhere',
    description:
      'An applicant who accepts an offer becomes an employee record, and that record is what the point of sale recognises. No second directory to keep in step.',
  },
  {
    icon: <CalendarClock />,
    title: 'Attendance that reaches payroll',
    description:
      'Time in, leave, and payroll are one chain. A leave approval changes the payslip without anyone re-keying it.',
  },
  {
    icon: <Layers />,
    title: 'Modular by design',
    description:
      'Finance, CRM, and warehouse slot in later without reshaping what is already running.',
  },
]

interface Module {
  icon: ReactNode
  name: string
  status: 'live' | 'planned'
  points: string[]
}

const MODULES: Module[] = [
  {
    icon: <Users />,
    name: 'People',
    status: 'live',
    points: ['Recruitment and applicants', 'Employees and deployment', 'Attendance, leave, payroll'],
  },
  {
    icon: <ShoppingCart />,
    name: 'Sales',
    status: 'live',
    points: ['Products and categories', 'Inventory movements', 'Orders and daily sales'],
  },
  {
    icon: <BarChart3 />,
    name: 'Reports',
    status: 'live',
    points: ['Cross-module reporting', 'Charts and analytics', 'Export ready'],
  },
  {
    icon: <Wallet />,
    name: 'Finance',
    status: 'planned',
    points: ['Budgets and expenses', 'Vendors and payments', 'Consumes payroll'],
  },
]

export function Platform() {
  return (
    <>
      <section id="platform" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-heading">
            Built as one system, not three that talk
          </h2>
          <p className="mt-3 max-w-2xl text-body">
            Most businesses run HR and sales on separate software and reconcile them by
            hand. JMAC removes the reconciliation.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="flex gap-4 p-6">
                  <div className="text-primary-hover [&_svg]:size-5" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="mt-2">{feature.description}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-heading">Business modules</h2>
          <p className="mt-3 max-w-2xl text-body">
            Each module owns its own processes. None of them owns a second copy of your
            employees.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((module) => (
              <Card key={module.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-primary-hover [&_svg]:size-5" aria-hidden="true">
                      {module.icon}
                    </div>
                    <Badge variant={module.status === 'live' ? 'success' : 'neutral'}>
                      {module.status === 'live' ? 'Available' : 'Planned'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-base">{module.name}</CardTitle>
                  <ul className="mt-3 flex flex-col gap-1.5 text-sm text-body">
                    {module.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-heading">
            The dashboard your permissions build
          </h2>
          <p className="mt-3 max-w-2xl text-body">
            There is one dashboard. What appears on it depends on what you are allowed to
            see — an illustration, using the same components the product is built from.
          </p>

          {/* Static illustration, not a live dashboard. Real figures need a
              signed-in session and permissions to go with it. */}
          <div
            aria-label="Illustration of the JMAC dashboard"
            className="mt-10 rounded-xl border border-border bg-background p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total employees" value="142" icon={<Users />} delta={4} />
              <StatCard label="Present today" value="128" icon={<UserCheck />} delta={2} />
              <StatCard label="Monthly revenue" value="₱71,400" icon={<Wallet />} delta={22} />
              <StatCard label="Low stock items" value="6" icon={<Boxes />} delta={-11} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
