import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

interface Employee {
  name: string
  department: string
}

const columns: ColumnDef<Employee>[] = [
  { accessorKey: 'name', header: 'Name', id: 'name' },
  { accessorKey: 'department', header: 'Department', id: 'department' },
]

const data: Employee[] = [
  { name: 'Maria Santos', department: 'Human Resources' },
  { name: 'Ana Cruz', department: 'Retail Operations' },
  { name: 'Jose Reyes', department: 'Human Resources' },
]

function bodyRowNames() {
  const [, ...bodyRows] = screen.getAllByRole('row')
  return bodyRows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)
}

describe('DataTable', () => {
  it('renders a row per record', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(data.length + 1)
  })

  it('sorts when a column header is activated, and reports the direction', async () => {
    render(<DataTable columns={columns} data={data} />)
    expect(bodyRowNames()).toEqual(['Maria Santos', 'Ana Cruz', 'Jose Reyes'])

    await userEvent.click(screen.getByRole('button', { name: /Name/ }))
    expect(bodyRowNames()).toEqual(['Ana Cruz', 'Jose Reyes', 'Maria Santos'])
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )

    await userEvent.click(screen.getByRole('button', { name: /Name/ }))
    expect(bodyRowNames()).toEqual(['Maria Santos', 'Jose Reyes', 'Ana Cruz'])
  })

  it('filters across every column from the search box', async () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="Search employees" />)
    await userEvent.type(screen.getByLabelText('Search employees'), 'Retail')
    expect(screen.getByText('Ana Cruz')).toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })

  it('hides a column when it is toggled off', async () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByRole('columnheader', { name: /Department/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'department' }))

    expect(screen.queryByRole('columnheader', { name: /Department/ })).not.toBeInTheDocument()
  })

  it('paginates once the data exceeds a page', async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      name: `Person ${index}`,
      department: 'Retail Operations',
    }))
    render(<DataTable columns={columns} data={many} pageSize={5} />)

    expect(screen.getByText('Person 0')).toBeInTheDocument()
    expect(screen.queryByText('Person 5')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Person 5')).toBeInTheDocument()
    expect(screen.queryByText('Person 0')).not.toBeInTheDocument()
  })

  it('shows an empty state rather than an empty grid', () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="No employees yet" />)
    expect(screen.getByText('No employees yet')).toBeInTheDocument()
  })

  it('shows skeleton rows while loading, and no empty state', () => {
    render(<DataTable columns={columns} data={[]} loading emptyTitle="No employees yet" />)
    expect(screen.queryByText('No employees yet')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('renders no search box when no placeholder is given', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
