import { AuthProvider } from '@/components/providers/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import '../globals.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthProvider>
  )
}
