import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const NAV = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Modules', href: '/#modules' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/#contact' },
]

/** The signed-out marketing shell. Unlike AppLayout it has no permission
 *  filtering — every link here is public by definition. */
export function PublicLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-dropdown border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            JMAC
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-body transition-colors hover:text-heading"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setNavOpen(true)}
            >
              <Menu aria-hidden="true" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </div>
        </div>
      </header>

      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent side="right" className="md:hidden">
          <DrawerHeader>
            <DrawerTitle>JMAC</DrawerTitle>
          </DrawerHeader>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setNavOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-muted hover:text-heading"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </DrawerContent>
      </Drawer>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-heading">JMAC</p>
            <p className="mt-1 text-sm text-body">
              Human resources and point of sale, in one enterprise platform.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JMAC Digital Enterprise
          </p>
        </div>
      </footer>
    </div>
  )
}
