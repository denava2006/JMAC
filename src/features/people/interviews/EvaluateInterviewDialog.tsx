import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { interviewStageLabel, type InterviewStage } from '@/lib/interviewLabels'
import {
  fetchFinalInterviewers,
  interviewQueueQueryKey,
  interviewStatsQueryKey,
  submitFinalEvaluation,
  submitInitialEvaluation,
} from '@/services/interviews'

type Decision = 'passed' | 'failed'

interface EvaluationErrors {
  rejectionReason?: string
  finalInterviewerId?: string
}

export function EvaluateInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  interviewId,
  stage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  interviewId: string
  stage: InterviewStage
}) {
  const queryClient = useQueryClient()
  const [decision, setDecision] = useState<Decision>('passed')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [finalInterviewerId, setFinalInterviewerId] = useState('')
  const [errors, setErrors] = useState<EvaluationErrors>({})

  const needsFinalInterviewer = stage === 'initial' && decision === 'passed'
  const finalInterviewers = useQuery({
    queryKey: ['people', 'final-interviewers'],
    queryFn: fetchFinalInterviewers,
    enabled: open && needsFinalInterviewer,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!open) return
    setDecision('passed')
    setNotes('')
    setRejectionReason('')
    setFinalInterviewerId('')
    setErrors({})
  }, [applicationId, interviewId, open, stage])

  const mutation = useMutation({
    mutationFn: () => {
      if (stage === 'initial') {
        return submitInitialEvaluation({
          interviewId,
          applicationId,
          decision,
          notes,
          rejectionReason: decision === 'failed' ? rejectionReason : undefined,
          finalInterviewerId: decision === 'passed' ? finalInterviewerId : undefined,
        })
      }
      return submitFinalEvaluation({
        interviewId,
        applicationId,
        decision,
        notes,
        rejectionReason: decision === 'failed' ? rejectionReason : undefined,
      })
    },
    onSuccess: () => {
      const stageLabel = interviewStageLabel(stage).toLowerCase()
      toast.success(
        decision === 'passed'
          ? stage === 'final'
            ? 'Applicant passed the final interview and is now hired'
            : `Applicant passed the ${stageLabel} interview`
          : `Applicant rejected after the ${stageLabel} interview`
      )
      queryClient.invalidateQueries({ queryKey: interviewQueueQueryKey })
      queryClient.invalidateQueries({ queryKey: interviewStatsQueryKey })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not record the evaluation'),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: EvaluationErrors = {}
    if (decision === 'failed' && !rejectionReason.trim()) {
      nextErrors.rejectionReason = 'Give a reason for rejecting this applicant.'
    }
    if (needsFinalInterviewer && !finalInterviewerId) {
      nextErrors.finalInterviewerId = 'Choose who will run the final interview.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record {interviewStageLabel(stage).toLowerCase()} interview result</DialogTitle>
          <DialogDescription>
            Record a pass or fail decision and any notes needed for the recruitment record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`${stage}-decision`} required>
              Decision
            </Label>
            <Select
              value={decision}
              onValueChange={(value: Decision) => {
                setDecision(value)
                setErrors({})
                if (value === 'passed') setRejectionReason('')
                else setFinalInterviewerId('')
              }}
            >
              <SelectTrigger id={`${stage}-decision`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">Pass</SelectItem>
                <SelectItem value="failed">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${stage}-evaluation-notes`}>Evaluation notes</Label>
            <Textarea
              id={`${stage}-evaluation-notes`}
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Summarize the interview and the basis for this decision."
            />
          </div>

          {decision === 'failed' ? (
            <div className="grid gap-2">
              <Label htmlFor={`${stage}-rejection-reason`} required>
                Rejection reason
              </Label>
              <Textarea
                id={`${stage}-rejection-reason`}
                rows={3}
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value)
                  setErrors((current) => ({ ...current, rejectionReason: undefined }))
                }}
                invalid={Boolean(errors.rejectionReason)}
                aria-describedby={errors.rejectionReason ? `${stage}-rejection-reason-error` : undefined}
                placeholder="This reason is retained with the application."
              />
              {errors.rejectionReason ? (
                <p id={`${stage}-rejection-reason-error`} className="text-xs text-error">
                  {errors.rejectionReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {needsFinalInterviewer ? (
            <div className="grid gap-2">
              <Label htmlFor="final-interviewer" required>
                Final interviewer
              </Label>
              <Select
                value={finalInterviewerId}
                onValueChange={(value) => {
                  setFinalInterviewerId(value)
                  setErrors((current) => ({ ...current, finalInterviewerId: undefined }))
                }}
                disabled={finalInterviewers.isPending || finalInterviewers.isError}
              >
                <SelectTrigger
                  id="final-interviewer"
                  aria-invalid={errors.finalInterviewerId ? true : undefined}
                  aria-describedby={errors.finalInterviewerId ? 'final-interviewer-error' : undefined}
                  className={errors.finalInterviewerId ? 'border-error' : undefined}
                >
                  <SelectValue placeholder={finalInterviewers.isPending ? 'Loading…' : 'Choose an interviewer'} />
                </SelectTrigger>
                <SelectContent>
                  {(finalInterviewers.data ?? []).map((interviewer) => (
                    <SelectItem key={interviewer.id} value={interviewer.id}>
                      {interviewer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.finalInterviewerId ? (
                <p id="final-interviewer-error" className="text-xs text-error">
                  {errors.finalInterviewerId}
                </p>
              ) : null}
              {finalInterviewers.isError ? (
                <p className="text-xs text-error">Could not load eligible final interviewers. Refresh and try again.</p>
              ) : !finalInterviewers.isPending && finalInterviewers.data?.length === 0 ? (
                <p className="text-xs text-warning">
                  No eligible final interviewer is visible for this application. Ask an administrator to review the assignment.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  If manager-directory access is restricted, the manager who screened this application is offered as a fallback.
                </p>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decision === 'failed' ? 'destructive' : 'primary'}
              disabled={mutation.isPending || (needsFinalInterviewer && finalInterviewers.isPending)}
            >
              {mutation.isPending ? 'Saving…' : decision === 'passed' ? 'Record pass' : 'Record rejection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
