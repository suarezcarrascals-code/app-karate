import { describe, it, expect, vi } from 'vitest'
import { signIn, signUp, signOut, fetchProfile } from './auth'

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@test.com' }, session: { access_token: 'tok' } },
        error: null,
      })),
      signUp: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'p1', user_id: 'user-1', nombre: 'Test', email: 'test@test.com', estado: 'pendiente', role: 'organizador' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

describe('signIn', () => {
  it('retorna user y session con credenciales válidas', async () => {
    const result = await signIn('test@test.com', '123456')
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('session')
  })
})

describe('signUp', () => {
  it('retorna el usuario creado', async () => {
    const result = await signUp('test@test.com', '123456', 'Test User')
    expect(result).toHaveProperty('user')
  })
})

describe('signOut', () => {
  it('no lanza error', async () => {
    await expect(signOut()).resolves.not.toThrow()
  })
})

describe('fetchProfile', () => {
  it('retorna perfil con estado y role', async () => {
    const profile = await fetchProfile('user-1')
    expect(profile).toHaveProperty('estado')
    expect(profile).toHaveProperty('role')
    expect(profile.estado).toBe('pendiente')
  })
})
