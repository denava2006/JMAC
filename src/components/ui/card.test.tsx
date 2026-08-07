import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

describe('Card', () => {
  it('renders its composed parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Active headcount</CardDescription>
        </CardHeader>
        <CardContent>142</CardContent>
        <CardFooter>Updated today</CardFooter>
      </Card>
    )
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
    expect(screen.getByText('Active headcount')).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()
    expect(screen.getByText('Updated today')).toBeInTheDocument()
  })

  it('lets a caller className override a default', () => {
    render(
      <Card className="rounded-xl" data-testid="card">
        content
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('rounded-xl')
    expect(card).not.toHaveClass('rounded-lg')
  })
})

describe('StatCard', () => {
  it('renders its label and value', () => {
    render(<StatCard label="Total employees" value={142} />)
    expect(screen.getByText('Total employees')).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()
  })

  it('colours a positive delta as success and signs it', () => {
    render(<StatCard label="Revenue" value="₱120,000" delta={12} />)
    expect(screen.getByText('+12%')).toHaveClass('text-success')
  })

  it('colours a negative delta as error', () => {
    render(<StatCard label="Revenue" value="₱90,000" delta={-8} />)
    const delta = screen.getByText('-8%')
    expect(delta).toHaveClass('text-error')
    expect(delta).not.toHaveClass('text-success')
  })

  it('treats zero as not-worse, so a flat period does not read as a fall', () => {
    render(<StatCard label="Orders" value={0} delta={0} />)
    expect(screen.getByText('+0%')).toHaveClass('text-success')
  })

  it('hides the value and the delta while loading', () => {
    render(<StatCard label="Revenue" value="₱120,000" delta={12} loading />)
    expect(screen.queryByText('₱120,000')).not.toBeInTheDocument()
    expect(screen.queryByText('+12%')).not.toBeInTheDocument()
  })

  it('renders no delta row when none is given', () => {
    render(<StatCard label="Revenue" value="₱120,000" />)
    expect(screen.queryByText('vs last period')).not.toBeInTheDocument()
  })
})
