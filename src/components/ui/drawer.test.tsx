import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

function Fixture({ side }: { side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Drawer>
      <DrawerTrigger>Menu</DrawerTrigger>
      <DrawerContent side={side}>
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('opens on trigger click', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Menu'))
    expect(await screen.findByRole('dialog', { name: 'Navigation' })).toBeInTheDocument()
  })

  it('enters from the right by default', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Menu'))
    expect(await screen.findByRole('dialog')).toHaveClass('right-0')
  })

  it('enters from the requested side instead', async () => {
    render(<Fixture side="left" />)
    await userEvent.click(screen.getByText('Menu'))
    const drawer = await screen.findByRole('dialog')
    expect(drawer).toHaveClass('left-0')
    expect(drawer).not.toHaveClass('right-0')
  })

  it('closes on Escape, like the Dialog it is built on', async () => {
    render(<Fixture />)
    await userEvent.click(screen.getByText('Menu'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
