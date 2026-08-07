import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('supabase client', () => {
  it('throws a directive error when the URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    await expect(import('@/lib/supabase')).rejects.toThrow(/VITE_SUPABASE_URL/)
  })

  it('throws a directive error when the anon key is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:56321')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    await expect(import('@/lib/supabase')).rejects.toThrow(/VITE_SUPABASE_ANON_KEY/)
  })

  it('exposes a client with auth when both variables are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:56321')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })
})
