import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  deployApplicant,
  deploymentQueueQueryKey,
  fetchBranches,
  fetchReportingManagers,
  fetchWorkLocations,
  fetchWorkSchedules,
  type DeployableApplication,
} from '@/services/deployment'

export function DeployApplicantDialog({
  application,
  open,
  onOpenChange,
}: {
  application: DeployableApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [branchId, setBranchId] = useState('')
  const [workLocationId, setWorkLocationId] = useState('')
  const [workScheduleId, setWorkScheduleId] = useState('')
  const [reportingManager, setReportingManager] = useState('')
  const [reportingTime, setReportingTime] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setBranchId('')
    setWorkLocationId('')
    setWorkScheduleId('')
    setReportingManager('')
    setReportingTime('')
    setRemarks('')
    setError(null)
  }, [open, application?.id])

  const branches = useQuery({ queryKey: ['people', 'branches'], queryFn: fetchBranches, enabled: open })

  // A work location belongs to a branch, so it cannot be chosen before one is —
  // and the RPC rejects a location from a different branch.
  const locations = useQuery({
    queryKey: ['people', 'work-locations', branchId],
    queryFn: () => fetchWorkLocations(branchId),
    enabled: open && Boolean(branchId),
  })

  const employmentType = application?.employmentType ?? null
  const schedules = useQuery({
    queryKey: ['people', 'work-schedules', employmentType],
    queryFn: employmentType ? () => fetchWorkSchedules(employmentType) : async () => [],
    enabled: open && Boolean(employmentType),
  })

  const managers = useQuery({
    queryKey: ['people', 'reporting-managers'],
    queryFn: fetchReportingManagers,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () =>
      deployApplicant({
        applicationId: application!.id,
        branchId,
        workLocationId: workLocationId || undefined,
        workScheduleId: workScheduleId || undefined,
        reportingManager: reportingManager || undefined,
        reportingTime,
        remarks,
      }),
    onSuccess: () => {
      toast.success('Applicant deployed')
      queryClient.invalidateQueries({ queryKey: deploymentQueueQueryKey })
      onOpenChange(false)
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not deploy this applicant'),
  })

  if (!application) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete deployment</DialogTitle>
          <DialogDescription>
            {application.applicantName} · {application.positionTitle}
            {application.department ? ` · ${application.department}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            mutation.mutate()
          }}
        >
          {error ? (
            <p role="alert" className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="deployment-date">Deployment date</Label>
            {/* Read-only: this is the start date the applicant accepted on the
                offer. Changing it here would contradict the signed contract. */}
            <Input id="deployment-date" value={application.startDate ?? '—'} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              The start date agreed on the job offer. To change it, revise the offer.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deployment-branch" required>
              Assigned branch
            </Label>
            <Select
              value={branchId}
              onValueChange={(value) => {
                setBranchId(value)
                // A location under the old branch cannot stay selected.
                setWorkLocationId('')
              }}
            >
              <SelectTrigger id="deployment-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {(branches.data ?? []).map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deployment-location">Work location</Label>
            <Select value={workLocationId} onValueChange={setWorkLocationId} disabled={!branchId}>
              <SelectTrigger id="deployment-location">
                <SelectValue placeholder={branchId ? 'Select work location' : 'Select a branch first'} />
              </SelectTrigger>
              <SelectContent>
                {(locations.data ?? []).map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branchId && locations.data?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No work locations are listed for this branch.</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deployment-schedule">Work schedule</Label>
            <Select value={workScheduleId} onValueChange={setWorkScheduleId} disabled={!employmentType}>
              <SelectTrigger id="deployment-schedule">
                <SelectValue placeholder="Select work schedule" />
              </SelectTrigger>
              <SelectContent>
                {(schedules.data ?? []).map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only schedules matching the offer&rsquo;s employment type are offered.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="reporting-manager">Reporting manager</Label>
              <Select value={reportingManager} onValueChange={setReportingManager}>
                <SelectTrigger id="reporting-manager">
                  <SelectValue placeholder={managers.isPending ? 'Loading…' : 'Select manager'} />
                </SelectTrigger>
                <SelectContent>
                  {(managers.data ?? []).map((manager) => (
                    <SelectItem key={manager.id} value={manager.name}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reporting-time">Reporting time</Label>
              <Input
                id="reporting-time"
                value={reportingTime}
                onChange={(event) => setReportingTime(event.target.value)}
                placeholder="e.g. 8:00 AM"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deployment-remarks">Remarks</Label>
            <Textarea
              id="deployment-remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Anything the new employee should know on day one."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !branchId}>
              {mutation.isPending ? 'Deploying…' : 'Complete deployment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
