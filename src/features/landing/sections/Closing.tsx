import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpenPositions } from '@/features/careers/OpenPositions'

const FAQ = [
  {
    question: 'Is JMAC one application or several?',
    answer:
      'One. People and Sales are modules inside a single platform — one sign-in, one employee directory, one set of permissions. You never switch systems.',
  },
  {
    question: 'What happens when someone is hired?',
    answer:
      'An accepted offer becomes an employee record, and that record is what the point of sale recognises. Nobody re-enters the person into a second system.',
  },
  {
    question: 'Who can see payroll?',
    answer:
      'Only the roles granted the payroll permissions. Access is enforced in the database, so hiding a menu is never the only thing standing between someone and a payslip.',
  },
  {
    question: 'Is Finance available?',
    answer:
      'Not yet. The finance module is designed for and its data model is in place, but it is not part of the current release.',
  },
]

export function Closing() {
  return (
    <>
      <section id="careers" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-heading">Careers</h2>
          <p className="mt-3 max-w-2xl text-body">
            Roles below come straight from our recruitment system — if it is listed, it is
            open.
          </p>

          <div className="mt-10">
            <OpenPositions />
          </div>

          <Button asChild variant="secondary" className="mt-6">
            <Link to="/careers">See all roles</Link>
          </Button>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Tabs defaultValue="faq">
            <TabsList>
              <TabsTrigger value="faq">Questions</TabsTrigger>
              <TabsTrigger value="testimonials">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="faq">
              <dl className="mt-4 grid gap-6 sm:grid-cols-2">
                {FAQ.map((item) => (
                  <div key={item.question}>
                    <dt className="font-medium text-heading">{item.question}</dt>
                    <dd className="mt-2 text-sm text-body">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>

            <TabsContent value="testimonials">
              {/* A placeholder, as the brief specifies. Inventing quotations
                  from customers who have not said them would be a fabricated
                  endorsement, not a design placeholder. */}
              <EmptyState
                title="Customer stories are on the way"
                description="We would rather show you real ones. This section fills in as customers go live."
                className="mt-4"
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section id="contact" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-heading">Get in touch</h2>
          <p className="mt-3 max-w-2xl text-body">
            Questions about the platform, a role, or a deployment — reach the team directly.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-start gap-3 p-6">
                <Mail className="size-5 shrink-0 text-primary-hover" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-heading">Email</p>
                  <p className="mt-1 text-sm text-body">hello@jmacdigital.example</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 p-6">
                <Phone className="size-5 shrink-0 text-primary-hover" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-heading">Phone</p>
                  <p className="tabular mt-1 text-sm text-body">+63 2 8000 0000</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 p-6">
                <MapPin className="size-5 shrink-0 text-primary-hover" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-heading">Office</p>
                  <p className="mt-1 text-sm text-body">Quezon City, Metro Manila</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
