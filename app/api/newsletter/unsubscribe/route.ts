import { unsubscribe } from '@/lib/subscribers'
import { verifyToken } from '@/lib/tokens'

/** RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post), CASL. */
export async function POST(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email') ?? ''
  const token = url.searchParams.get('token') ?? ''
  if (!email || !verifyToken('unsubscribe', email, token))
    return Response.json({ error: 'invalid' }, { status: 400 })
  await unsubscribe(email)
  return Response.json({ ok: true })
}
