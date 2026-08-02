import { signSession } from '../../../../lib/admin-auth'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await signSession()
  const response = Response.json({ ok: true })
  response.headers.set(
    'Set-Cookie',
    `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  )
  return response
}
