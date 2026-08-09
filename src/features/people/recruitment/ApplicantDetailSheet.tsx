import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BriefcaseBusiness, Check, FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { ContractPanel } from '@/features/people/recruitment/ContractPanel'
import { PrepareOfferDialog } from '@/features/people/recruitment/PrepareOfferDialog'
import { applicationStatusLabel, applicationStatusVariant, offerStatusLabel } from '@/lib/applicationLabels'
import {
  applicationStatsQueryKey,
  applicationsQueryKey,
  qualifyApplication,
  rejectApplication,
  resumeSignedUrl,
  type ApplicationRow,
} from '@/services/recruitment'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-heading">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-4">{children}</dl>
    </section>
  )
}

export function ApplicantDetailSheet({
  application,
  open,
  onOpenChange,
  canScreen,
  canPrepareOffer = false,
}: {
  application: ApplicationRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canScreen: boolean
  canPrepareOffer?: boolean
}) {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [preparingOffer, setPreparingOffer] = useState(false)

  useEffect(() => {
    if (open) {
      setRejecting(false)
      setReason('')
      setPreparingOffer(false)
    }
  }, [open, application?.id])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: applicationsQueryKey })
    queryClient.invalidateQueries({ queryKey: applicationStatsQueryKey })
  }

  const qualify = useMutation({
    mutationFn: () => qualifyApplication(application!.id),
    onSuccess: () => {
      toast.success('Applicant qualified')
      invalidate()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not qualify this applicant'),
  })

  const reject = useMutation({
    mutationFn: () => {
      const trimmed = reason.trim()
      if (!trimmed) throw new Error('Give a reason for rejecting this applicant.')
      return rejectApplication(application!.id, trimmed)
    },
    onSuccess: () => {
      toast.success('Applicant rejected')
      invalidate()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not reject this applicant'),
  })

  const resume = useMutation({
    mutationFn: () => resumeSignedUrl(application!.resumeUrl as string),
    onSuccess: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
    onError: () => toast.error('Could not open the résumé. Please try again.'),
  })

  const actionable = canScreen && application?.status === 'submitted'
  const offerRevision = application?.status === 'offered' && application.latestOfferStatus === 'declined'
  const offerActionable = Boolean(
    canPrepareOffer &&
    application?.employmentType &&
    (application.status === 'hired' || offerRevision)
  )
  const busy = qualify.isPending || reject.isPending

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreparingOffer(false)
          onOpenChange(nextOpen)
        }}
      >
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
              <DrawerTitle>Applicant</DrawerTitle>
            )}
          </DrawerHeader>

          {application ? (
            <div className="mt-6 flex flex-col gap-6">
            <Section title="Contact">
              <Field label="Email" value={application.email} />
              <Field label="Phone" value={application.phone} />
            </Section>

            <Section title="Address">
              <Field label="Street" value={application.street} />
              <Field label="Barangay" value={application.barangay} />
              <Field label="City" value={application.city} />
              <Field label="Province" value={application.province} />
            </Section>

            <Section title="Application">
              <Field label="Applied" value={<span className="tabular">{application.createdAt.slice(0, 10)}</span>} />
              <Field
                label="Reviewed"
                value={application.reviewedAt ? <span className="tabular">{application.reviewedAt.slice(0, 10)}</span> : null}
              />
              {application.status === 'rejected' && application.rejectionReason ? (
                <div className="col-span-2">
                  <Field label="Rejection reason" value={application.rejectionReason} />
                </div>
              ) : null}
              {application.latestOfferStatus ? (
                <Field label="Latest offer" value={offerStatusLabel(application.latestOfferStatus)} />
              ) : null}
            </Section>

            {application.coverLetter ? (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover letter</h3>
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted p-3 text-sm text-body">
                  {application.coverLetter}
                </p>
              </section>
            ) : null}

            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={!application.resumeUrl || resume.isPending}
                onClick={() => resume.mutate()}
              >
                <FileText aria-hidden="true" />
                {application.resumeUrl ? (resume.isPending ? 'Opening…' : 'View résumé') : 'No résumé attached'}
              </Button>
            </div>

            {actionable ? (
              <div className="flex flex-col gap-3 border-t border-border pt-6">
                {rejecting ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reject-reason" required>
                      Reason for rejection
                    </Label>
                    <Textarea
                      id="reject-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="The applicant may be told this reason."
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>
                        Cancel
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => reject.mutate()} disabled={busy}>
                        {reject.isPending ? 'Rejecting…' : 'Confirm rejection'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setRejecting(true)} disabled={busy}>
                      <X aria-hidden="true" />
                      Reject
                    </Button>
                    <Button type="button" onClick={() => qualify.mutate()} disabled={busy}>
                      <Check aria-hidden="true" />
                      {qualify.isPending ? 'Qualifying…' : 'Qualify'}
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Once the offer is accepted the contract is the next stage. Both
                it and offer preparation are gated on deployment.manage. */}
            {application.latestOfferStatus === 'accepted' ? (
              <ContractPanel applicationId={application.id} canManage={canPrepareOffer} />
            ) : null}

            {offerActionable ? (
              <div className="flex justify-end border-t border-border pt-6">
                <Button type="button" onClick={() => setPreparingOffer(true)}>
                  <BriefcaseBusiness aria-hidden="true" />
                  {offerRevision ? 'Prepare revised offer' : 'Prepare job offer'}
                </Button>
              </div>
            ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      {application?.employmentType ? (
        <PrepareOfferDialog
          open={preparingOffer}
          onOpenChange={setPreparingOffer}
          applicationId={application.id}
          applicantName={application.applicantName}
          positionTitle={application.positionTitle}
          department={application.department}
          employmentType={application.employmentType}
          revision={offerRevision}
          onPrepared={() => onOpenChange(false)}
        />
      ) : null}
    </>
  )
}
