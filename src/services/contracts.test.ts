import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc, upload, storageFrom } = vi.hoisted(() => {
  const upload = vi.fn()
  return { rpc: vi.fn(), upload, storageFrom: vi.fn(() => ({ upload })) }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, storage: { from: storageFrom } },
}))

import {
  generateContract,
  markContractPrinted,
  recordContractSigning,
  validateSignedContractFile,
} from '@/services/contracts'

function pdf(name = 'signed.pdf'): File {
  return new File(['contract'], name, { type: 'application/pdf' })
}

beforeEach(() => {
  rpc.mockReset()
  upload.mockReset()
  storageFrom.mockClear()
})

describe('generateContract', () => {
  it('calls the RPC and returns the new contract id', async () => {
    rpc.mockResolvedValue({ data: 'contract-1', error: null })

    await expect(generateContract({ applicationId: 'app-1', terms: '  Terms  ' })).resolves.toBe('contract-1')

    expect(rpc).toHaveBeenCalledWith('generate_employment_contract', {
      p_application_id: 'app-1',
      p_terms: 'Terms',
      p_company_policies: undefined,
      p_additional_notes: undefined,
    })
  })

  // The database refuses a contract without an accepted offer; the point of the
  // mapping is that HR sees why rather than a raw SQLSTATE.
  it('explains that an accepted offer is required', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'CONTRACT_OFFER_NOT_ACCEPTED' } })
    await expect(generateContract({ applicationId: 'app-1' })).rejects.toThrow(/accept a job offer/i)
  })

  it('explains a signed contract cannot be regenerated', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'CONTRACT_ALREADY_SIGNED' } })
    await expect(generateContract({ applicationId: 'app-1' })).rejects.toThrow(/already been signed/i)
  })

  it('falls back to a generic message for an unknown failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(generateContract({ applicationId: 'app-1' })).rejects.toThrow(/Could not prepare the contract/i)
  })
})

describe('markContractPrinted', () => {
  it('issues the contract for signature', async () => {
    rpc.mockResolvedValue({ error: null })
    await expect(markContractPrinted('contract-1')).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith('mark_contract_printed', { p_contract_id: 'contract-1' })
  })

  it('surfaces an authorization failure', async () => {
    rpc.mockResolvedValue({ error: { message: 'CONTRACT_NOT_AUTHORIZED' } })
    await expect(markContractPrinted('contract-1')).rejects.toThrow(/not allowed/i)
  })
})

describe('validateSignedContractFile', () => {
  it('accepts a PDF within the limit', () => {
    expect(validateSignedContractFile(pdf())).toBeNull()
  })

  it('rejects an unsupported type', () => {
    expect(validateSignedContractFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toMatch(/PDF, JPG, or PNG/)
  })

  it('rejects a file over 10 MB', () => {
    const big = pdf('big.pdf')
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
    expect(validateSignedContractFile(big)).toMatch(/10 MB/)
  })
})

describe('recordContractSigning', () => {
  it('uploads the signed copy, then records the signature with its path', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ error: null })

    await recordContractSigning({ contractId: 'contract-1', file: pdf(), signingNotes: ' ok ' })

    expect(storageFrom).toHaveBeenCalledWith('contracts')
    expect(upload).toHaveBeenCalledTimes(1)
    const recordedPath = rpc.mock.calls[0]![1].p_file_path as string
    // The stored path is what the row points at, so it must be the uploaded one.
    expect(recordedPath).toBe(upload.mock.calls[0]![0])
    expect(recordedPath.startsWith('contract-1/')).toBe(true)
    expect(rpc.mock.calls[0]![1].p_signing_notes).toBe('ok')
  })

  // Recording a signature whose file never landed would leave the row asserting
  // evidence that cannot be retrieved.
  it('does not record the signing when the upload fails', async () => {
    upload.mockResolvedValue({ error: { message: 'storage down' } })

    await expect(recordContractSigning({ contractId: 'contract-1', file: pdf() })).rejects.toThrow(/upload/i)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects an invalid file before touching storage', async () => {
    const bad = new File(['x'], 'a.txt', { type: 'text/plain' })
    await expect(recordContractSigning({ contractId: 'contract-1', file: bad })).rejects.toThrow(/PDF, JPG, or PNG/)
    expect(upload).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('explains that the contract must be issued first', async () => {
    upload.mockResolvedValue({ error: null })
    rpc.mockResolvedValue({ error: { message: 'CONTRACT_NOT_ISSUED' } })

    await expect(recordContractSigning({ contractId: 'contract-1', file: pdf() })).rejects.toThrow(/Issue the contract/i)
  })
})
