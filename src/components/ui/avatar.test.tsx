import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

describe('Avatar', () => {
  // Radix only swaps in the image once it loads, which jsdom never does, so
  // the fallback is what renders here. That is the case worth testing anyway:
  // most JMAC users have no avatar_url.
  it('shows the fallback when no image has loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="/nobody.png" alt="Maria Santos" />
        <AvatarFallback>MS</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('MS')).toBeInTheDocument()
  })

  it('lets a caller resize it', () => {
    render(
      <Avatar className="size-12" data-testid="avatar">
        <AvatarFallback>MS</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByTestId('avatar')
    expect(avatar).toHaveClass('size-12')
    expect(avatar).not.toHaveClass('size-9')
  })
})
