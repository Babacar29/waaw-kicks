import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '../../../lib/admin-auth'
import { AdminShell } from '../../../components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (!token || !(await verifySession(token))) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
