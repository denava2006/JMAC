import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { JOB_EMPLOYMENT_TYPES, jobEmploymentTypeLabel } from '@/lib/jobPostingLabels'
import {
  createJobPosting,
  fetchPositionOptions,
  jobPostingsQueryKey,
  positionOptionsQueryKey,
  updateJobPosting,
  type JobPosting,
} from '@/services/jobPostings'

function toIso(date: Date | undefined): string {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const todayIso = () => toIso(new Date())

const schema = z.object({
  positionId: z.string().min(1, 'Choose a position.'),
  employmentType: z.enum(['regular', 'part_time']),
  vacancies: z.number({ message: 'Enter a number.' }).int().min(1, 'At least one vacancy.').max(999, 'That is a lot of vacancies.'),
  description: z.string().min(20, 'Give at least a couple of sentences.'),
  requirements: z.string().optional(),
  // Belt and braces: the calendar already disables past days, but validating
  // here too means a stale value carried in from an edited draft cannot slip
  // through. An empty string means "no closing date", which is allowed.
  closingDate: z
    .string()
    .optional()
    .refine((value) => !value || value >= todayIso(), {
      message: 'The closing date cannot be in the past.',
    }),
})

type JobPostingValues = z.infer<typeof schema>

export function JobPostingDialog({
  posting,
  open,
  onOpenChange,
}: {
  /** null = create a new draft; a posting = edit it. */
  posting: JobPosting | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const editing = posting !== null

  const positions = useQuery({
    queryKey: positionOptionsQueryKey,
    queryFn: fetchPositionOptions,
    enabled: open,
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobPostingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      positionId: '',
      employmentType: 'regular',
      vacancies: 1,
      description: '',
      requirements: '',
      closingDate: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      posting
        ? {
            positionId: posting.positionId,
            employmentType: posting.employmentType as 'regular' | 'part_time',
            vacancies: posting.vacancies,
            description: posting.description,
            requirements: posting.requirements ?? '',
            closingDate: posting.closingDate ?? '',
          }
        : {
            positionId: '',
            employmentType: 'regular',
            vacancies: 1,
            description: '',
            requirements: '',
            closingDate: '',
          }
    )
  }, [open, posting, reset])

  const mutation = useMutation({
    mutationFn: (values: JobPostingValues) => {
      const chosen = (positions.data ?? []).find((p) => p.id === values.positionId)
      if (!chosen) throw new Error('That position could not be found. Refresh and try again.')
      const payload = {
        positionId: values.positionId,
        departmentId: chosen.departmentId,
        description: values.description,
        requirements: values.requirements ?? '',
        employmentType: values.employmentType,
        vacancies: values.vacancies,
        closingDate: values.closingDate || null,
      }
      return editing ? updateJobPosting(posting.id, payload) : createJobPosting(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Posting updated' : 'Draft posting created')
      queryClient.invalidateQueries({ queryKey: jobPostingsQueryKey })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save the posting'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit job posting' : 'New job posting'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Changes take effect immediately, including on the public careers page if this posting is open.'
              : 'Saved as a draft. Publish it to make it public.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="position" required>
              Position
            </Label>
            <Controller
              control={control}
              name="positionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="position"
                    aria-invalid={errors.positionId ? true : undefined}
                    className={errors.positionId ? 'border-error' : undefined}
                  >
                    <SelectValue placeholder={positions.isPending ? 'Loading…' : 'Choose a position'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(positions.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title} · {option.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.positionId ? <p className="text-xs text-error">{errors.positionId.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type" required>
                Employment type
              </Label>
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {jobEmploymentTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vacancies" required>
                Vacancies
              </Label>
              <Input
                id="vacancies"
                type="number"
                min={1}
                invalid={Boolean(errors.vacancies)}
                {...register('vacancies', { valueAsNumber: true })}
              />
              {errors.vacancies ? <p className="text-xs text-error">{errors.vacancies.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" required>
              Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              invalid={Boolean(errors.description)}
              placeholder="What the role involves."
              {...register('description')}
            />
            {errors.description ? <p className="text-xs text-error">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" rows={3} placeholder="Qualifications and experience." {...register('requirements')} />
          </div>

          <div className="grid gap-2">
            <Label>Closing date</Label>
            <Controller
              control={control}
              name="closingDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                  onChange={(date) => field.onChange(toIso(date))}
                  placeholder="No closing date"
                  minDate={new Date()}
                  invalid={Boolean(errors.closingDate)}
                />
              )}
            />
            {errors.closingDate ? <p className="text-xs text-error">{errors.closingDate.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
