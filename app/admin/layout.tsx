import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '../../lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (!token || !(await verifySession(token))) {
    redirect('/admin/login')
  }

  return <div className="bg-white min-h-screen">{children}</div>
}
