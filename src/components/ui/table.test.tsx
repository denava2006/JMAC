import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

describe('Table', () => {
  it('renders semantic table structure', () => {
    render(
      <Table>
        <TableCaption>Employees</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Maria Santos</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole('table', { name: 'Employees' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Maria Santos' })).toBeInTheDocument()
  })

  // Enterprise tables are wider than a phone. Without this the page body
  // scrolls sideways instead of the table.
  it('wraps itself in a horizontally scrollable container', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto')
  })
})

describe('Pagination', () => {
  it('reports the current position', () => {
    render(<Pagination page={2} pageCount={5} totalRows={48} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('48')).toBeInTheDocument()
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()

    rerender(<Pagination page={3} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Previous/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
  })

  it('reports the requested page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})

describe('Tabs', () => {
  it('shows only the active panel and switches on click', async () => {
    render(
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="details">Personal information</TabsContent>
        <TabsContent value="documents">Uploaded files</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Personal information')).toBeInTheDocument()
    expect(screen.queryByText('Uploaded files')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }))
    expect(screen.getByText('Uploaded files')).toBeInTheDocument()
    expect(screen.queryByText('Personal information')).not.toBeInTheDocument()
  })

  it('marks the active tab as selected for assistive technology', () => {
    render(
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Documents' })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('Breadcrumb', () => {
  const items = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'People', href: '/dashboard/people' },
    { label: 'Maria Santos' },
  ]

  it('links every crumb but the last', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Maria Santos' })).not.toBeInTheDocument()
  })

  it('marks the last crumb as the current page', () => {
    render(<Breadcrumb items={items} />)
    expect(screen.getByText('Maria Santos')).toHaveAttribute('aria-current', 'page')
  })

  it('lets a caller supply its own link element', () => {
    render(
      <Breadcrumb
        items={items}
        renderLink={(item) => <span data-testid="custom">{item.label}</span>}
      />
    )
    expect(screen.getAllByTestId('custom')).toHaveLength(2)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
