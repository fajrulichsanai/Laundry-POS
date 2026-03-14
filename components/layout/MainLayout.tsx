'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Receipt, 
  LogOut, 
  Menu, 
  X,
  Settings,
  FileText,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { logout } from '@/lib/actions/auth'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const menuItems = [
    { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { id: '/pos', label: 'Kasir (POS)', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: '/transactions', label: 'Riwayat Transaksi', icon: Receipt, roles: ['admin', 'cashier'] },
    { id: '/customers', label: 'Pelanggan', icon: Users, roles: ['admin', 'cashier'] },
    { id: '/services', label: 'Layanan', icon: Package, roles: ['admin'] },
    { id: '/expenses', label: 'Pengeluaran', icon: DollarSign, roles: ['admin'] },
    { id: '/reports', label: 'Laporan', icon: FileText, roles: ['admin'] },
    { id: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
  ]

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  )

  const currentPage = menuItems.find(item => pathname.startsWith(item.id))

  const handleLogout = async () => {
    await logout()
  }

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform lg:transform-none transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              FC
            </div>
            <span className="font-bold text-xl tracking-tight">FreshClean</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                pathname.startsWith(item.id)
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 capitalize">
            {currentPage?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Header actions can go here */}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
