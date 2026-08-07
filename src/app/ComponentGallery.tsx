import { Building2, Download, Users } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chart,
  ChartTooltip,
  Checkbox,
  DataTable,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Input,
  Label,
  Loader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StatCard,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  chartSeriesColor,
  toast,
  type ColumnDef,
} from '@/components/ui'

/** A single page rendering every component in the library.
 *
 *  jsdom does no layout, so the 355 unit tests cannot see a clipped dropdown,
 *  an unreadable contrast pairing, or a chart at zero height. Track 2A shipped
 *  a Select whose viewport was clamped to one row and seven task reviews
 *  missed it. This page is where that class of bug is visible. */

interface Employee {
  name: string
  department: string
  status: string
}

const employeeColumns: ColumnDef<Employee>[] = [
  { accessorKey: 'name', header: 'Name', id: 'name' },
  { accessorKey: 'department', header: 'Department', id: 'department' },
  {
    accessorKey: 'status',
    header: 'Status',
    id: 'status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Active' ? 'success' : 'neutral'}>
        {row.original.status}
      </Badge>
    ),
  },
]

const employees: Employee[] = [
  { name: 'Maria Santos', department: 'Human Resources', status: 'Active' },
  { name: 'Jose Reyes', department: 'Human Resources', status: 'Active' },
  { name: 'Ana Cruz', department: 'Retail Operations', status: 'On leave' },
  { name: 'Paolo Mendoza', department: 'Retail Operations', status: 'Active' },
]

const salesByMonth = [
  { month: 'Mar', sales: 42000 },
  { month: 'Apr', sales: 51000 },
  { month: 'May', sales: 48500 },
  { month: 'Jun', sales: 63000 },
  { month: 'Jul', sales: 58200 },
  { month: 'Aug', sales: 71400 },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function ComponentGallery() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 7, 15))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10">
          <header className="flex flex-col gap-2">
            <Breadcrumb
              items={[
                { label: 'JMAC', href: '#' },
                { label: 'Design system', href: '#' },
                { label: 'Components' },
              ]}
            />
            <h1 className="text-3xl font-semibold text-heading">Component library</h1>
            <p className="text-body">
              All 30 shared components, rendered together so layout, contrast, and overlay
              behaviour can be judged in a browser rather than inferred from jsdom.
            </p>
          </header>

          <Section title="Stat cards">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total employees" value="142" icon={<Users />} delta={4} />
              <StatCard label="Monthly revenue" value="₱71,400" delta={22} />
              <StatCard label="Open positions" value="2" icon={<Building2 />} delta={-8} />
              <StatCard label="Pending leave" value="7" loading />
            </div>
          </Section>

          <Section title="Buttons and badges">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Download">
                <Download />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Draft</Badge>
              <Badge variant="success">Approved</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="error">Rejected</Badge>
              <Badge variant="info">New</Badge>
              <Badge variant="outline">Archived</Badge>
              <Avatar>
                <AvatarFallback>MS</AvatarFallback>
              </Avatar>
            </div>
          </Section>

          <Section title="Form controls">
            <div className="grid max-w-2xl gap-5">
              <div className="grid gap-2">
                <Label htmlFor="gallery-name" required>
                  Full name
                </Label>
                <Input id="gallery-name" placeholder="Maria Santos" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gallery-email">Email</Label>
                <Input id="gallery-email" invalid defaultValue="not-an-email" />
                <p className="text-xs text-error">Enter a valid email address.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gallery-dept">Department</Label>
                <Select>
                  <SelectTrigger id="gallery-dept">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="retail">Retail Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gallery-start">Start date</Label>
                <DatePicker id="gallery-start" value={date} onChange={setDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gallery-notes">Notes</Label>
                <Textarea id="gallery-notes" placeholder="Interview went well…" />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="gallery-terms" defaultChecked />
                  <Label htmlFor="gallery-terms">Accept terms</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="gallery-notify" defaultChecked />
                  <Label htmlFor="gallery-notify">Email notifications</Label>
                </div>
              </div>
              <RadioGroup defaultValue="full_time" aria-label="Employment type">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="full_time" id="gallery-ft" />
                  <Label htmlFor="gallery-ft">Full time</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="part_time" id="gallery-pt" />
                  <Label htmlFor="gallery-pt">Part time</Label>
                </div>
              </RadioGroup>
            </div>
          </Section>

          <Section title="Overlays">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete employee</DialogTitle>
                    <DialogDescription>
                      This removes Maria Santos from the directory. It cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary">Cancel</Button>
                    <Button variant="destructive">Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="secondary">Open drawer</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Navigation</DrawerTitle>
                  </DrawerHeader>
                  <nav className="flex flex-col gap-1 text-sm text-body">
                    <span>Dashboard</span>
                    <span>People</span>
                    <span>Sales</span>
                  </nav>
                </DrawerContent>
              </Drawer>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Account menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Signed in as Maria</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem disabled>Billing</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Filters</Button>
                </PopoverTrigger>
                <PopoverContent align="start">
                  <p className="text-sm font-medium text-heading">Filter by department</p>
                  <p className="mt-1 text-sm text-body">A popover sits above the modal layer.</p>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>Download as Excel</TooltipContent>
              </Tooltip>

              <Button variant="secondary" onClick={() => toast.success('Employee saved')}>
                Raise a toast
              </Button>
            </div>
          </Section>

          <Section title="Data table">
            <DataTable
              columns={employeeColumns}
              data={employees}
              searchPlaceholder="Search employees"
              toolbar={<Button size="sm">Add employee</Button>}
            />
          </Section>

          <Section title="Chart">
            <Card>
              <CardHeader>
                <CardTitle>Sales by month</CardTitle>
                <CardDescription>Last six months, in pesos</CardDescription>
              </CardHeader>
              <CardContent>
                <Chart label="Bar chart of sales by month, peaking at 71,400 pesos in August">
                  <BarChart data={salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip />
                    <Bar dataKey="sales" fill={chartSeriesColor(0)} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </Chart>
              </CardContent>
            </Card>
          </Section>

          <Section title="Tabs, calendar, and states">
            <Tabs defaultValue="calendar">
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="empty">Empty</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
              </TabsList>
              <TabsContent value="calendar">
                <Card className="w-fit">
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </Card>
              </TabsContent>
              <TabsContent value="empty">
                <EmptyState
                  icon={<Users />}
                  title="No open positions"
                  description="New roles appear here as soon as HR publishes them."
                  action={{ label: 'Post a job', onClick: () => toast('Would open the form') }}
                />
              </TabsContent>
              <TabsContent value="error">
                <ErrorState
                  title="Could not load employees"
                  description="The request timed out. Check your connection."
                  onRetry={() => toast('Retrying')}
                />
              </TabsContent>
              <TabsContent value="loading">
                <div className="flex flex-col gap-3">
                  <Loader label="Loading employees" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </TabsContent>
            </Tabs>
          </Section>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
