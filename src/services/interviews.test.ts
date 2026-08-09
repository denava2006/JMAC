import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, from, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), rpc: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser }, from, rpc },
}))

import {
  fetchFinalInterviewers,
  fetchInterviewLocations,
  fetchInterviewQueue,
  fetchInterviewStats,
  isMeetingUrl,
  scheduleInterview,
  scopeInterviewQueue,
  submitFinalEvaluation,
  submitInitialEvaluation,
  type InterviewApplication,
} from '@/services/interviews'
import {
  INTERVIEW_STAGE_LABEL,
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_VARIANT,
  interviewStageLabel,
  interviewStatusLabel,
  interviewStatusVariant,
  type InterviewStage,
  type InterviewStatus,
} from '@/lib/interviewLabels'

type QueryResult = { data: { id: string }[] | null; error: { message: string } | null }

function updateChain(result: QueryResult = { data: [{ id: 'updated-1' }], error: null }) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    select: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function listChain(result: { data: unknown; error: { message: string } | null }) {
  const chain = {
    select: vi.fn(() => chain),
    in: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function history(error: { message: string } | null = null) {
  return { insert: vi.fn().mockResolvedValue({ error }) }
}

/** from(table).select('*', { count, head }).eq('status', x) -> { count, error } */
function statsChain(result: { count: number | null; error: { message: string } | null }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => Promise.resolve(result)),
  }
  return chain
}

function application(overrides: Partial<InterviewApplication> = {}): InterviewApplication {
  return {
    id: 'app-1',
    status: 'qualified',
    applicantName: 'Ada Applicant',
    email: 'ada@example.com',
    phone: null,
    positionTitle: 'Cashier',
    department: 'Sales',
    reviewedById: 'manager-1',
    finalInterviewerId: null,
    createdAt: '2026-08-09T00:00:00Z',
    interviews: [],
    ...overrides,
  }
}

beforeEach(() => {
  from.mockReset()
  rpc.mockReset()
  rpc.mockResolvedValue({ data: 'hr_manager', error: null })
  getUser.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})

describe('fetchInterviewQueue', () => {
  it('maps the nested application, posting, and interview shape', async () => {
    const query = listChain({
      data: [
        {
          id: 'app-1',
          status: 'interview_scheduled',
          reviewed_by: 'manager-1',
          final_interviewer_id: null,
          created_at: '2026-08-09T00:00:00Z',
          applicants: {
            first_name: 'Ada',
            middle_name: null,
            last_name: 'Applicant',
            email: 'ada@example.com',
            phone: '09170000000',
          },
          job_postings: { positions: { title: 'Cashier' }, departments: { name: 'Sales' } },
          interviews: [
            {
              id: 'interview-1',
              interview_type: 'initial',
              status: 'scheduled',
              scheduled_at: '2099-01-02T03:04:00Z',
              mode: 'online',
              location: null,
              meeting_link: 'https://meet.example.com/ada',
              interviewer_id: 'user-1',
              remarks: null,
              interview_notes: null,
              final_remarks: null,
              rejection_reason: null,
            },
          ],
        },
      ],
      error: null,
    })
    from.mockReturnValue(query)

    const rows = await fetchInterviewQueue()

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'app-1',
        applicantName: 'Ada Applicant',
        positionTitle: 'Cashier',
        reviewedById: 'manager-1',
        interviews: [expect.objectContaining({ id: 'interview-1', interviewType: 'initial' })],
      }),
    ])
  })
})

describe('fetchInterviewStats', () => {
  it('counts scheduled and failed interviews plus hired applications', async () => {
    const scheduled = statsChain({ count: 4, error: null })
    const hired = statsChain({ count: 2, error: null })
    const failed = statsChain({ count: 1, error: null })
    from.mockReturnValueOnce(scheduled).mockReturnValueOnce(hired).mockReturnValueOnce(failed)

    await expect(fetchInterviewStats()).resolves.toEqual({
      scheduledCount: 4,
      hiredCount: 2,
      rejectedCount: 1,
    })
    // Hired is a property of the application, not of any one interview round.
    expect(from).toHaveBeenNthCalledWith(1, 'interviews')
    expect(from).toHaveBeenNthCalledWith(2, 'applications')
    expect(from).toHaveBeenNthCalledWith(3, 'interviews')
    expect(scheduled.eq).toHaveBeenCalledWith('status', 'scheduled')
    expect(hired.eq).toHaveBeenCalledWith('status', 'hired')
    expect(failed.eq).toHaveBeenCalledWith('status', 'failed')
  })

  it('reads a null count as zero rather than NaN', async () => {
    from.mockReturnValue(statsChain({ count: null, error: null }))
    await expect(fetchInterviewStats()).resolves.toEqual({
      scheduledCount: 0,
      hiredCount: 0,
      rejectedCount: 0,
    })
  })

  it('surfaces a count failure instead of reporting zeroes', async () => {
    from.mockReturnValue(statsChain({ count: null, error: { message: 'permission denied' } }))
    await expect(fetchInterviewStats()).rejects.toThrow('permission denied')
  })
})

describe('fetchFinalInterviewers', () => {
  it('reads the eligible interviewers from the SECURITY DEFINER RPC', async () => {
    rpc.mockResolvedValue({
      data: [
        { id: 'manager-1', full_name: 'Mina Manager' },
        { id: 'admin-1', full_name: 'Alex Administrator' },
      ],
      error: null,
    })

    await expect(fetchFinalInterviewers()).resolves.toEqual([
      { id: 'manager-1', fullName: 'Mina Manager' },
      { id: 'admin-1', fullName: 'Alex Administrator' },
    ])
    // Never the `profiles` view: it is security-invoker and returns nothing to
    // HR Staff, which is the role that has to nominate a final interviewer.
    expect(rpc).toHaveBeenCalledWith('eligible_final_interviewers')
    expect(from).not.toHaveBeenCalled()
  })

  it('falls back to a generic name when the directory has none', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'manager-1', full_name: null }], error: null })
    await expect(fetchFinalInterviewers()).resolves.toEqual([{ id: 'manager-1', fullName: 'HR Manager' }])
  })

  it('surfaces an authorization failure from the RPC', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'You are not authorized to view interviewers.' } })
    await expect(fetchFinalInterviewers()).rejects.toThrow(/not authorized/i)
  })
})

describe('fetchInterviewLocations', () => {
  it('composes branch and location labels and keeps a branch-less fallback', async () => {
    const query = listChain({
      data: [
        { name: 'Counter 2', is_active: true, branches: { name: 'Cebu Main' } },
        { name: 'Remote Annex', is_active: true, branches: null },
        { name: 'Interview Room', is_active: true, branches: { name: 'Bacolod' } },
      ],
      error: null,
    })
    from.mockReturnValue(query)

    await expect(fetchInterviewLocations()).resolves.toEqual([
      { label: 'Bacolod · Interview Room' },
      { label: 'Cebu Main · Counter 2' },
      { label: 'Remote Annex' },
    ])
    expect(query.eq).toHaveBeenCalledWith('is_active', true)
  })

  it('surfaces a location lookup failure', async () => {
    from.mockReturnValue(listChain({ data: null, error: { message: 'locations unavailable' } }))
    await expect(fetchInterviewLocations()).rejects.toThrow('locations unavailable')
  })
})

describe('isMeetingUrl', () => {
  it.each([
    'https://meet.google.com/abc-defg',
    '  https://teams.microsoft.com/l/meetup-join/123  ',
  ])('accepts a joinable HTTPS URL: %s', (value) => {
    expect(isMeetingUrl(value)).toBe(true)
  })

  it.each([
    'http://meet.google.com/abc-defg',
    'https://localhost/meeting',
    'meet.google.com/abc-defg',
    'Google Meet',
    'https://.com/meeting',
    'https://foo./meeting',
  ])('rejects an unsafe or non-public meeting URL: %s', (value) => {
    expect(isMeetingUrl(value)).toBe(false)
  })
})

describe('scheduleInterview', () => {
  it('schedules an initial interview, advances the qualified application, and records history', async () => {
    const interviewInsert = vi.fn().mockResolvedValue({ error: null })
    const applications = updateChain()
    const historyTable = history()
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return { insert: interviewInsert }
      if (table === 'applications') return applications
      return historyTable
    })

    await scheduleInterview({
      applicationId: 'app-1',
      stage: 'initial',
      scheduledAt: '2099-01-02T11:04:00+08:00',
      mode: 'online',
      meetingLink: '  https://meet.example.com/ada  ',
      location: 'ignored',
      notes: '  Bring identification.  ',
    })

    expect(interviewInsert).toHaveBeenCalledWith({
      application_id: 'app-1',
      interview_type: 'initial',
      scheduled_at: '2099-01-02T03:04:00.000Z',
      interviewer_id: 'user-1',
      mode: 'online',
      meeting_link: 'https://meet.example.com/ada',
      location: null,
      remarks: 'Bring identification.',
      status: 'scheduled',
    })
    expect(applications.eq).toHaveBeenCalledWith('status', 'qualified')
    expect(historyTable.insert).toHaveBeenCalledWith({
      application_id: 'app-1',
      event: 'initial_interview_scheduled',
      actor_id: 'user-1',
    })
  })

  it('schedules a face-to-face final interview without changing application status', async () => {
    const interviewInsert = vi.fn().mockResolvedValue({ error: null })
    const historyTable = history()
    from.mockImplementation((table: string) => (table === 'interviews' ? { insert: interviewInsert } : historyTable))

    await scheduleInterview({
      applicationId: 'app-1',
      stage: 'final',
      scheduledAt: '2099-01-02T03:04:00.000Z',
      mode: 'face_to_face',
      location: '  Main Office  ',
      meetingLink: 'https://ignored.example.com',
    })

    expect(interviewInsert).toHaveBeenCalledWith(expect.objectContaining({
      interview_type: 'final',
      meeting_link: null,
      location: 'Main Office',
    }))
    expect(from).not.toHaveBeenCalledWith('applications')
    expect(historyTable.insert).toHaveBeenCalledWith(expect.objectContaining({ event: 'final_interview_scheduled' }))
  })

  it('rejects past times and mode-specific missing fields before any write', async () => {
    await expect(scheduleInterview({
      applicationId: 'app-1',
      stage: 'initial',
      scheduledAt: '2000-01-01T00:00:00.000Z',
      mode: 'online',
      meetingLink: 'https://meet.example.com',
    })).rejects.toThrow(/future/i)

    await expect(scheduleInterview({
      applicationId: 'app-1',
      stage: 'initial',
      scheduledAt: '2099-01-02T03:04:00.000Z',
      mode: 'face_to_face',
    })).rejects.toThrow(/location/i)

    expect(getUser).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })

  it('detects a stale application transition', async () => {
    const applications = updateChain({ data: [], error: null })
    from.mockImplementation((table: string) =>
      table === 'interviews' ? { insert: vi.fn().mockResolvedValue({ error: null }) } : applications
    )

    await expect(scheduleInterview({
      applicationId: 'app-1',
      stage: 'initial',
      scheduledAt: '2099-01-02T03:04:00.000Z',
      mode: 'online',
      meetingLink: 'https://meet.example.com',
    })).rejects.toThrow(/no longer waiting/i)
  })
})

describe('submitInitialEvaluation', () => {
  it('passes the interview, assigns the final interviewer, and records history', async () => {
    const interview = updateChain()
    const applications = updateChain()
    const historyTable = history()
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return interview
      if (table === 'applications') return applications
      return historyTable
    })

    await submitInitialEvaluation({
      interviewId: 'interview-1',
      applicationId: 'app-1',
      decision: 'passed',
      notes: '  Strong candidate.  ',
      finalInterviewerId: 'manager-1',
    })

    expect(interview.update).toHaveBeenCalledWith({
      status: 'passed',
      interview_notes: 'Strong candidate.',
      rejection_reason: null,
    })
    expect(interview.eq.mock.calls).toEqual([
      ['id', 'interview-1'],
      ['application_id', 'app-1'],
      ['interview_type', 'initial'],
      ['status', 'scheduled'],
    ])
    expect(applications.update).toHaveBeenCalledWith({ final_interviewer_id: 'manager-1' })
    expect(applications.eq.mock.calls).toEqual([
      ['id', 'app-1'],
      ['status', 'interview_scheduled'],
    ])
    expect(applications.is).toHaveBeenCalledWith('final_interviewer_id', null)
    expect(historyTable.insert).toHaveBeenCalledWith({
      application_id: 'app-1',
      event: 'initial_interview_passed',
      actor_id: 'user-1',
    })
  })

  it('fails the interview, rejects the application, and records the reason', async () => {
    const interview = updateChain()
    const applications = updateChain()
    const historyTable = history()
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return interview
      if (table === 'applications') return applications
      return historyTable
    })

    await submitInitialEvaluation({
      interviewId: 'interview-1',
      applicationId: 'app-1',
      decision: 'failed',
      rejectionReason: '  Experience does not match.  ',
    })

    expect(applications.update).toHaveBeenCalledWith({
      status: 'rejected',
      rejection_reason: 'Experience does not match.',
    })
    expect(historyTable.insert).toHaveBeenCalledWith(expect.objectContaining({
      event: 'initial_interview_rejected',
      notes: 'Experience does not match.',
    }))
  })

  it('validates pass assignment and failure reason before touching the database', async () => {
    await expect(submitInitialEvaluation({
      interviewId: 'interview-1',
      applicationId: 'app-1',
      decision: 'passed',
    })).rejects.toThrow(/choose an HR Manager/i)

    await expect(submitInitialEvaluation({
      interviewId: 'interview-1',
      applicationId: 'app-1',
      decision: 'failed',
      rejectionReason: '   ',
    })).rejects.toThrow(/reason/i)

    expect(getUser).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })
})

describe('submitFinalEvaluation', () => {
  it('hires an applicant who passes the final interview', async () => {
    const interview = updateChain()
    const applications = updateChain()
    const historyTable = history()
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return interview
      if (table === 'applications') return applications
      return historyTable
    })

    await submitFinalEvaluation({
      interviewId: 'interview-2',
      applicationId: 'app-1',
      decision: 'passed',
      notes: 'Approved for hire.',
    })

    expect(interview.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'passed' }))
    expect(interview.eq.mock.calls).toEqual([
      ['id', 'interview-2'],
      ['application_id', 'app-1'],
      ['interview_type', 'final'],
      ['status', 'scheduled'],
    ])
    expect(applications.update).toHaveBeenCalledWith({ status: 'hired' })
    expect(applications.eq.mock.calls).toEqual([
      ['id', 'app-1'],
      ['status', 'interview_scheduled'],
    ])
    expect(historyTable.insert).toHaveBeenCalledWith({
      application_id: 'app-1',
      event: 'hired',
      actor_id: 'user-1',
    })
  })

  it('rejects an applicant who fails the final interview', async () => {
    const interview = updateChain()
    const applications = updateChain()
    const historyTable = history()
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return interview
      if (table === 'applications') return applications
      return historyTable
    })

    await submitFinalEvaluation({
      interviewId: 'interview-2',
      applicationId: 'app-1',
      decision: 'failed',
      rejectionReason: 'Role alignment was not strong enough.',
    })

    expect(applications.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }))
    expect(historyTable.insert).toHaveBeenCalledWith(expect.objectContaining({ event: 'final_interview_rejected' }))
  })

  it('propagates an audit-history failure', async () => {
    const interview = updateChain()
    const applications = updateChain()
    const historyTable = history({ message: 'history unavailable' })
    from.mockImplementation((table: string) => {
      if (table === 'interviews') return interview
      if (table === 'applications') return applications
      return historyTable
    })

    await expect(submitFinalEvaluation({
      interviewId: 'interview-2',
      applicationId: 'app-1',
      decision: 'passed',
    })).rejects.toThrow('history unavailable')
  })
})

describe('scopeInterviewQueue', () => {
  const rejectedAfterInterview = application({
    id: 'rejected-interview',
    status: 'rejected',
    interviews: [{
      id: 'interview-1',
      interviewType: 'initial',
      status: 'failed',
      scheduledAt: '2026-08-09T00:00:00Z',
      mode: 'online',
      location: null,
      meetingLink: 'https://meet.example.com',
      interviewerId: 'staff-1',
      remarks: null,
      interviewNotes: null,
      finalRemarks: null,
      rejectionReason: 'Not selected',
    }],
  })
  const rows = [
    application({ id: 'unassigned' }),
    application({ id: 'assigned-mine', finalInterviewerId: 'manager-1' }),
    application({ id: 'assigned-other', finalInterviewerId: 'manager-2' }),
    application({ id: 'screening-reject', status: 'rejected' }),
    rejectedAfterInterview,
  ]

  it('shows admins every interview-pipeline row but drops screening rejections', () => {
    expect(scopeInterviewQueue(rows, 'admin', 'admin-1').map((row) => row.id)).toEqual([
      'unassigned', 'assigned-mine', 'assigned-other', 'rejected-interview',
    ])
  })

  it('scopes HR managers to their final assignments and HR staff to unassigned work', () => {
    expect(scopeInterviewQueue(rows, 'hr_manager', 'manager-1').map((row) => row.id)).toEqual(['assigned-mine'])
    expect(scopeInterviewQueue(rows, 'hr_staff', 'staff-1').map((row) => row.id)).toEqual([
      'unassigned', 'rejected-interview',
    ])
  })

  it('fails closed for a missing profile or an unsupported role', () => {
    expect(scopeInterviewQueue(rows, undefined, undefined)).toEqual([])
    expect(scopeInterviewQueue(rows, 'employee', 'employee-1')).toEqual([])
  })
})

describe('interview labels', () => {
  const statuses: InterviewStatus[] = ['scheduled', 'passed', 'failed', 'completed', 'cancelled']
  const stages: InterviewStage[] = ['initial', 'final']

  it('covers every interview status and stage', () => {
    expect(Object.keys(INTERVIEW_STATUS_LABEL).sort()).toEqual([...statuses].sort())
    expect(Object.keys(INTERVIEW_STATUS_VARIANT).sort()).toEqual([...statuses].sort())
    expect(Object.keys(INTERVIEW_STAGE_LABEL).sort()).toEqual([...stages].sort())
  })

  it('falls back to raw labels and a neutral badge for unknown values', () => {
    expect(interviewStatusLabel('mystery')).toBe('mystery')
    expect(interviewStatusVariant('mystery')).toBe('neutral')
    expect(interviewStageLabel('panel')).toBe('panel')
  })
})
