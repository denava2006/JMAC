import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-hover">
          JMAC Digital Enterprise
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-heading sm:text-5xl">
          One platform for the people who run your business
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-body">
          Human resources and point of sale stop being two systems. One sign-in, one
          employee record, one set of permissions — so a cashier hired this morning is
          on the till this afternoon.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="#platform">
              Explore platform
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/careers">Careers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
