'use client'

import { Settings as SettingsIcon, User, Bell, Lock, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pengaturan</h2>
        <p className="text-slate-600 mt-1">Kelola pengaturan sistem dan preferensi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { 
            icon: User, 
            title: 'Profil Pengguna', 
            desc: 'Kelola informasi akun dan profil Anda',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          },
          { 
            icon: Lock, 
            title: 'Keamanan', 
            desc: 'Ubah password dan pengaturan keamanan',
            color: 'text-red-600',
            bg: 'bg-red-50'
          },
          { 
            icon: Bell, 
            title: 'Notifikasi', 
            desc: 'Atur preferensi notifikasi sistem',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
          },
          { 
            icon: Database, 
            title: 'Backup Data', 
            desc: 'Backup dan restore data sistem',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
        ].map((setting, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${setting.bg}`}>
                <setting.icon size={24} className={setting.color} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{setting.title}</h3>
                <p className="text-sm text-slate-600">{setting.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
