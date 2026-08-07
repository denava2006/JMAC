import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Header } from '@/layouts/Header'
import { SidebarNav } from '@/layouts/Sidebar'

/**
 * The signed-in shell.
 *
 * Three sidebar behaviours, one navigation component:
 * - desktop (lg and up) — a 264px expanded rail, always visible
 * - tablet (md to lg)   — a 64px icon rail, labels in tooltips
 * - mobile (below md)   — a drawer over a scrim, opened from the header
 *
 * The drawer is only mounted below `lg`, so the same nav is never in the tree
 * twice — duplicate landmarks confuse screen-reader rotors, and duplicate
 * NavLinks would announce every destination twice.
 */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop and tablet rail */}
      <aside className="fixed inset-y-0 left-0 z-dropdown hidden w-16 border-r border-border bg-surface md:block lg:w-64">
        <div className="flex h-14 items-center justify-center border-b border-border lg:justify-start lg:px-6">
          <span className="text-sm font-semibold tracking-tight text-heading lg:text-base">
            <span className="lg:hidden">J</span>
            <span className="hidden lg:inline">JMAC</span>
          </span>
        </div>
        <SidebarNav collapsed className="lg:hidden" />
        <SidebarNav className="hidden lg:flex" />
      </aside>

      {/* Mobile drawer */}
      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <DrawerContent side="left" className="w-72 p-0 md:hidden">
          <DrawerHeader className="border-b border-border p-4">
            <DrawerTitle>JMAC</DrawerTitle>
          </DrawerHeader>
          <SidebarNav onNavigate={() => setNavOpen(false)} />
        </DrawerContent>
      </Drawer>

      <div className="md:pl-16 lg:pl-64">
        <Header onOpenNav={() => setNavOpen(true)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
