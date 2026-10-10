import { describe, expect, it, vi } from 'vitest'
import { verifySanityUser } from './admin-auth'

const TOKEN = 'skTestToken_abcdefghijklmnopqrstuvwxyz'
const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('verifySanityUser', () => {
  it('accepts a project member and calls users/me on the project host', async () => {
    const f = respond(200, {
      id: 'u1',
      email: 'owner@example.ca',
      roles: [{ name: 'administrator' }],
    })
    expect(await verifySanityUser(TOKEN, 'abc123', '2026-10-01', f)).toEqual({
      id: 'u1',
      email: 'owner@example.ca',
      roles: ['administrator'],
    })
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
      'https://abc123.api.sanity.io/v2026-10-01/users/me',
    )
  })
  it('rejects non-members, bad tokens and API errors', async () => {
    expect(
      await verifySanityUser(TOKEN, 'abc123', '2026-10-01', respond(200, { id: 'u2', roles: [] })),
    ).toBeNull()
    expect(
      await verifySanityUser(
        TOKEN,
        'abc123',
        '2026-10-01',
        respond(401, { error: 'Unauthorized' }),
      ),
    ).toBeNull()
    expect(
      await verifySanityUser(
        'short',
        'abc123',
        '2026-10-01',
        respond(200, { id: 'u1', roles: [{ name: 'administrator' }] }),
      ),
    ).toBeNull()
  })
})
