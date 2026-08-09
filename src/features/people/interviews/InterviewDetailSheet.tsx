import { useMutation } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { applicationStatusLabel, applicationStatusVariant } from '@/lib/applicationLabels'
import { ApplicantDetailSheet } from '@/features/people/recruitment/ApplicantDetailSheet'
import {
  interviewStageLabel,
  interviewStatusLabel,
  interviewStatusVariant,
  type InterviewStage,
} from '@/lib/interviewLabels'
import {
  getInterviewByStage,
  type InterviewApplication,
  type InterviewRecord,
} from '@/services/interviews'
import { EvaluateInterviewDialog } from '@/features/people/interviews/EvaluateInterviewDialog'
import { ScheduleInterviewDialog } from '@/features/people/interviews/ScheduleInterviewDialog'
import { toast } from '@/components/ui/toast'
import { fetchApplication, type ApplicationRow } from '@/services/recruitment'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-heading">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function formatDatetime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function InterviewRound({ stage, interview }: { stage: InterviewStage; interview: InterviewRecord | null }) {
  const meetingLink = safeHttpUrl(interview?.meetingLink ?? null)
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-heading">{interviewStageLabel(stage)} interview</h3>
        {interview ? (
          <Badge variant={interviewStatusVariant(interview.status)}>{interviewStatusLabel(interview.status)}</Badge>
        ) : (
          <Badge variant="neutral">Not scheduled</Badge>
        )}
      </div>

      {interview ? (
        <dl className="grid grid-cols-2 gap-4">
          <Field label="Scheduled" value={<span className="tabular">{formatDatetime(interview.scheduledAt)}</span>} />
          <Field label="Mode" value={interview.mode === 'face_to_face' ? 'Face-to-face' : interview.mode === 'online' ? 'Online' : null} />
          {interview.mode === 'online' ? (
            <div className="col-span-2">
              <Field
                label="Meeting link"
                value={meetingLink ? (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-hover underline underline-offset-2 hover:no-underline"
                  >
                    Open meeting link
                  </a>
                ) : interview.meetingLink ? (
                  <span className="text-error">Invalid meeting link</span>
                ) : null}
              />
            </div>
          ) : null}
          {interview.mode === 'face_to_face' ? (
            <div className="col-span-2">
              <Field label="Location" value={interview.location} />
            </div>
          ) : null}
          {interview.remarks ? (
            <div className="col-span-2">
              <Field label="Scheduling notes" value={interview.remarks} />
            </div>
          ) : null}
          {stage === 'initial' && interview.interviewNotes ? (
            <div className="col-span-2">
              <Field label="Evaluation notes" value={interview.interviewNotes} />
            </div>
          ) : null}
          {stage === 'final' && interview.finalRemarks ? (
            <div className="col-span-2">
              <Field label="Evaluation notes" value={interview.finalRemarks} />
            </div>
          ) : null}
          {interview.rejectionReason ? (
            <div className="col-span-2">
              <Field label="Rejection reason" value={interview.rejectionReason} />
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No interview has been scheduled for this round.</p>
      )}
    </section>
  )
}

type NextAction =
  | { kind: 'schedule'; stage: InterviewStage }
  | { kind: 'evaluate'; stage: InterviewStage; interviewId: string }
  | { kind: 'notice'; message: string }
  | null

function nextAction(
  application: InterviewApplication,
  initial: InterviewRecord | null,
  final: InterviewRecord | null,
  canManage: boolean,
  profileId: string | undefined
): NextAction {
  if (!canManage || !profileId || application.status === 'hired' || application.status === 'rejected') return null

  if (application.status === 'qualified' && !initial) return { kind: 'schedule', stage: 'initial' }

  if (initial?.status === 'scheduled') {
    return initial.interviewerId === profileId
      ? { kind: 'evaluate', stage: 'initial', interviewId: initial.id }
      : { kind: 'notice', message: 'Only the interviewer who scheduled this round can record its result.' }
  }

  if (initial?.status === 'passed' && !final) {
    if (!application.finalInterviewerId) {
      return { kind: 'notice', message: 'A final interviewer has not been assigned yet.' }
    }
    return application.finalInterviewerId === profileId
      ? { kind: 'schedule', stage: 'final' }
      : { kind: 'notice', message: 'The final round is assigned to another interviewer.' }
  }

  if (final?.status === 'scheduled') {
    return final.interviewerId === profileId
      ? { kind: 'evaluate', stage: 'final', interviewId: final.id }
      : { kind: 'notice', message: 'Only the assigned final interviewer can record this result.' }
  }

  return null
}

export function InterviewDetailSheet({
  application,
  open,
  onOpenChange,
  canManage,
  profileId,
}: {
  application: InterviewApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  profileId: string | undefined
}) {
  const [scheduleStage, setScheduleStage] = useState<InterviewStage | null>(null)
  const [evaluation, setEvaluation] = useState<{ stage: InterviewStage; interviewId: string } | null>(null)
  const [applicantDetails, setApplicantDetails] = useState<ApplicationRow | null>(null)
  const activeApplicantRequest = useRef(0)
  const interviewOpen = useRef(open)
  interviewOpen.current = open

  const applicant = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string; requestId: number }) => fetchApplication(applicationId),
    onSuccess: (details, variables) => {
      if (!interviewOpen.current || variables.requestId !== activeApplicantRequest.current) return
      setApplicantDetails(details)
      onOpenChange(false)
    },
    onError: (error, variables) => {
      if (!interviewOpen.current || variables.requestId !== activeApplicantRequest.current) return
      toast.error(error instanceof Error ? error.message : 'Could not load this application')
    },
  })

  useEffect(() => {
    if (open) {
      setApplicantDetails(null)
      return
    }
    activeApplicantRequest.current += 1
    setScheduleStage(null)
    setEvaluation(null)
  }, [application?.id, open])

  const initial = application ? getInterviewByStage(application.interviews, 'initial') : null
  const final = application ? getInterviewByStage(application.interviews, 'final') : null
  const action = application ? nextAction(application, initial, final, canManage, profileId) : null

  const changeInterviewOpen = (nextOpen: boolean) => {
    if (!nextOpen) activeApplicantRequest.current += 1
    onOpenChange(nextOpen)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={changeInterviewOpen}>
        <DrawerContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <DrawerHeader className="p-0">
            {application ? (
              <>
                <div className="flex items-center gap-3">
                  <DrawerTitle>{application.applicantName}</DrawerTitle>
                  <Badge variant={applicationStatusVariant(application.status)}>
                    {applicationStatusLabel(application.status)}
                  </Badge>
                </div>
                <DrawerDescription>
                  {application.positionTitle}
                  {application.department ? ` · ${application.department}` : ''}
                </DrawerDescription>
              </>
            ) : (
              <DrawerTitle>Interview</DrawerTitle>
            )}
          </DrawerHeader>

          {application ? (
            <div className="mt-6 flex flex-col gap-6">
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applicant</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Email" value={application.email} />
                  <Field label="Phone" value={application.phone} />
                  <Field label="Position" value={application.positionTitle} />
                  <Field label="Department" value={application.department} />
                </dl>
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={applicant.isPending}
                    onClick={() => {
                      const requestId = activeApplicantRequest.current + 1
                      activeApplicantRequest.current = requestId
                      applicant.mutate({ applicationId: application.id, requestId })
                    }}
                  >
                    <Eye aria-hidden="true" />
                    {applicant.isPending ? 'Loading applicant…' : 'View applicant'}
                  </Button>
                </div>
              </section>

              <InterviewRound stage="initial" interview={initial} />
              <InterviewRound stage="final" interview={final} />

              {action ? (
                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  {action.kind === 'notice' ? (
                    <p className="rounded-md border border-border bg-muted p-3 text-sm text-body">{action.message}</p>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (action.kind === 'schedule') setScheduleStage(action.stage)
                          else setEvaluation({ stage: action.stage, interviewId: action.interviewId })
                        }}
                      >
                        {action.kind === 'schedule'
                          ? `Schedule ${interviewStageLabel(action.stage).toLowerCase()} interview`
                          : `Record ${interviewStageLabel(action.stage).toLowerCase()} result`}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      {application && scheduleStage ? (
        <ScheduleInterviewDialog
          open
          onOpenChange={(nextOpen) => !nextOpen && setScheduleStage(null)}
          applicationId={application.id}
          stage={scheduleStage}
        />
      ) : null}

      {application && evaluation ? (
        <EvaluateInterviewDialog
          open
          onOpenChange={(nextOpen) => !nextOpen && setEvaluation(null)}
          applicationId={application.id}
          interviewId={evaluation.interviewId}
          stage={evaluation.stage}
        />
      ) : null}

      <ApplicantDetailSheet
        application={applicantDetails}
        open={applicantDetails !== null}
        onOpenChange={(nextOpen) => !nextOpen && setApplicantDetails(null)}
        canScreen={false}
      />
    </>
  )
}
