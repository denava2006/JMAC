import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { FileSignature, Printer, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import {
  contractQueryKey,
  fetchContractForApplication,
  generateContract,
  markContractPrinted,
  recordContractSigning,
  signedContractUrl,
  validateSignedContractFile,
  type ContractStatus,
} from '@/services/contracts'

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: 'Prepared',
  printed: 'Issued for signing',
  signed: 'Signed',
}

const STATUS_VARIANT: Record<ContractStatus, 'neutral' | 'info' | 'success'> = {
  draft: 'neutral',
  printed: 'info',
  signed: 'success',
}

/**
 * The contract stage, shown once the applicant has accepted their offer.
 *
 * Order is draft -> printed -> signed and the database enforces it, so this only
 * ever offers the one action the contract is actually ready for.
 */
export function ContractPanel({
  applicationId,
  canManage,
}: {
  applicationId: string
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const [recording, setRecording] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const contract = useQuery({
    queryKey: contractQueryKey(applicationId),
    queryFn: () => fetchContractForApplication(applicationId),
  })

  useEffect(() => {
    setRecording(false)
    setFile(null)
    setFileError(null)
    setNotes('')
  }, [applicationId])

  const refresh = () => queryClient.invalidateQueries({ queryKey: contractQueryKey(applicationId) })

  const prepare = useMutation({
    mutationFn: () => generateContract({ applicationId }),
    onSuccess: () => {
      toast.success('Contract prepared')
      void refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not prepare the contract'),
  })

  const issue = useMutation({
    mutationFn: () => markContractPrinted(contract.data!.id),
    onSuccess: () => {
      toast.success('Contract issued for signing')
      void refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not issue the contract'),
  })

  const sign = useMutation({
    mutationFn: () => recordContractSigning({ contractId: contract.data!.id, file: file as File, signingNotes: notes }),
    onSuccess: () => {
      toast.success('Signed contract recorded')
      setRecording(false)
      setFile(null)
      setNotes('')
      void refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not record the signing'),
  })

  const openSigned = useMutation({
    mutationFn: () => signedContractUrl(contract.data!.contractFileUrl as string),
    onSuccess: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
    onError: () => toast.error('Could not open the signed contract. Please try again.'),
  })

  const record = contract.data
  const busy = prepare.isPending || issue.isPending || sign.isPending

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment contract</h3>
        {record ? <Badge variant={STATUS_VARIANT[record.status]}>{STATUS_LABEL[record.status]}</Badge> : null}
      </div>

      {contract.isPending ? (
        <p className="text-sm text-muted-foreground">Loading contract…</p>
      ) : contract.isError ? (
        <p className="text-sm text-error">Could not load the contract.</p>
      ) : !record ? (
        <p className="text-sm text-body">
          The applicant has accepted their offer. Prepare the employment contract to continue.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Start date</dt>
            <dd className="tabular text-sm text-heading">{record.startDate ?? '—'}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signed</dt>
            <dd className="tabular text-sm text-heading">{record.signedAt?.slice(0, 10) ?? '—'}</dd>
          </div>
        </dl>
      )}

      {!canManage ? null : recording ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="signed-contract" required>
            Signed contract copy
          </Label>
          <input
            ref={fileInput}
            id="signed-contract"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="text-sm text-body file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-heading"
            onChange={(event) => {
              const picked = event.target.files?.[0] ?? null
              const problem = picked ? validateSignedContractFile(picked) : null
              setFile(problem ? null : picked)
              setFileError(problem)
            }}
          />
          {fileError ? <p className="text-xs text-error">{fileError}</p> : null}
          <Label htmlFor="signing-notes">Notes</Label>
          <Textarea
            id="signing-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything worth recording about the signing."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRecording(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => sign.mutate()} disabled={busy || !file}>
              {sign.isPending ? 'Recording…' : 'Record signing'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {record?.status === 'signed' && record.contractFileUrl ? (
            <Button type="button" variant="secondary" onClick={() => openSigned.mutate()} disabled={openSigned.isPending}>
              <FileSignature aria-hidden="true" />
              {openSigned.isPending ? 'Opening…' : 'View signed copy'}
            </Button>
          ) : null}

          {!record ? (
            <Button type="button" onClick={() => prepare.mutate()} disabled={busy}>
              <FileSignature aria-hidden="true" />
              {prepare.isPending ? 'Preparing…' : 'Prepare contract'}
            </Button>
          ) : record.status === 'draft' ? (
            <Button type="button" onClick={() => issue.mutate()} disabled={busy}>
              <Printer aria-hidden="true" />
              {issue.isPending ? 'Issuing…' : 'Issue for signing'}
            </Button>
          ) : record.status === 'printed' ? (
            <Button type="button" onClick={() => setRecording(true)} disabled={busy}>
              <Upload aria-hidden="true" />
              Record signed copy
            </Button>
          ) : null}
        </div>
      )}
    </section>
  )
}
