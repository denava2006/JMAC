import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { interviewStageLabel, type InterviewStage } from '@/lib/interviewLabels'
import {
  interviewQueueQueryKey,
  interviewStatsQueryKey,
  scheduleInterview,
} from '@/services/interviews'

function localDatetimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function nextMinuteLocalValue(): string {
  const nextMinute = new Date()
  nextMinute.setSeconds(0, 0)
  nextMinute.setMinutes(nextMinute.getMinutes() + 1)
  return localDatetimeValue(nextMinute)
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const schema = z
  .object({
    scheduledAt: z.string().min(1, 'Choose an interview date and time.'),
    mode: z.enum(['online', 'face_to_face']),
    meetingLink: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().max(2_000, 'Keep notes under 2,000 characters.').optional(),
  })
  .superRefine((values, context) => {
    const scheduledAt = new Date(values.scheduledAt)
    if (!values.scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Choose an interview time in the future.',
      })
    }

    if (values.mode === 'online') {
      const link = values.meetingLink?.trim() ?? ''
      if (!link || !isHttpUrl(link)) {
        context.addIssue({
          code: 'custom',
          path: ['meetingLink'],
          message: 'Enter a valid http or https meeting link.',
        })
      }
    } else if (!values.location?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Enter the face-to-face interview location.',
      })
    }
  })

type ScheduleValues = z.infer<typeof schema>

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  stage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  stage: InterviewStage
}) {
  const queryClient = useQueryClient()
  const [minDatetime, setMinDatetime] = useState('')
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduledAt: '',
      mode: 'online',
      meetingLink: '',
      location: '',
      notes: '',
    },
  })
  const mode = useWatch({ control, name: 'mode' })

  useEffect(() => {
    if (!open) return
    setMinDatetime(nextMinuteLocalValue())
    reset({ scheduledAt: '', mode: 'online', meetingLink: '', location: '', notes: '' })
  }, [applicationId, open, reset, stage])

  const mutation = useMutation({
    mutationFn: (values: ScheduleValues) =>
      scheduleInterview({
        applicationId,
        stage,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        mode: values.mode,
        meetingLink: values.mode === 'online' ? values.meetingLink : undefined,
        location: values.mode === 'face_to_face' ? values.location : undefined,
        notes: values.notes,
      }),
    onSuccess: () => {
      toast.success(`${interviewStageLabel(stage)} interview scheduled`)
      queryClient.invalidateQueries({ queryKey: interviewQueueQueryKey })
      queryClient.invalidateQueries({ queryKey: interviewStatsQueryKey })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not schedule the interview'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule {interviewStageLabel(stage).toLowerCase()} interview</DialogTitle>
          <DialogDescription>
            You will be recorded as the interviewer. Choose a future time and how the interview will take place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`${stage}-scheduled-at`} required>
              Date and time
            </Label>
            <Input
              id={`${stage}-scheduled-at`}
              type="datetime-local"
              min={minDatetime || undefined}
              invalid={Boolean(errors.scheduledAt)}
              aria-describedby={errors.scheduledAt ? `${stage}-scheduled-at-error` : undefined}
              {...register('scheduledAt')}
            />
            {errors.scheduledAt ? (
              <p id={`${stage}-scheduled-at-error`} className="text-xs text-error">
                {errors.scheduledAt.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${stage}-mode`} required>
              Interview mode
            </Label>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: 'online' | 'face_to_face') => {
                    field.onChange(value)
                    if (value === 'online') setValue('location', '')
                    else setValue('meetingLink', '')
                  }}
                >
                  <SelectTrigger id={`${stage}-mode`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="face_to_face">Face-to-face</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {mode === 'online' ? (
            <div className="grid gap-2">
              <Label htmlFor={`${stage}-meeting-link`} required>
                Meeting link
              </Label>
              <Input
                id={`${stage}-meeting-link`}
                type="url"
                placeholder="https://meet.example.com/interview"
                invalid={Boolean(errors.meetingLink)}
                aria-describedby={errors.meetingLink ? `${stage}-meeting-link-error` : undefined}
                {...register('meetingLink')}
              />
              {errors.meetingLink ? (
                <p id={`${stage}-meeting-link-error`} className="text-xs text-error">
                  {errors.meetingLink.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor={`${stage}-location`} required>
                Location
              </Label>
              <Input
                id={`${stage}-location`}
                placeholder="Branch, office, or room"
                invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? `${stage}-location-error` : undefined}
                {...register('location')}
              />
              {errors.location ? (
                <p id={`${stage}-location-error`} className="text-xs text-error">
                  {errors.location.message}
                </p>
              ) : null}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor={`${stage}-schedule-notes`}>Notes</Label>
            <Textarea
              id={`${stage}-schedule-notes`}
              rows={3}
              placeholder="Preparation instructions or other details."
              invalid={Boolean(errors.notes)}
              {...register('notes')}
            />
            {errors.notes ? <p className="text-xs text-error">{errors.notes.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Scheduling…' : 'Schedule interview'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
