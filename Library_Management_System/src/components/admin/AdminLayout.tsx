import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AdminPinGate } from '../../components/admin/AdminPinGate';
import { KioskHeader } from '../../components/KioskHeader';
import {
  Activity,
  BookOpen,
  LayoutDashboard,
  DoorOpen,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/admin/live', label: 'Canlı Takip', icon: Activity },
  { to: '/admin/students', label: 'Öğrenci Yönetimi', icon: Users },
  { to: '/admin/rooms', label: 'Salon Yönetimi', icon: DoorOpen },
  { to: '/admin/reports', label: 'Raporlar & Analizler', icon: LayoutDashboard },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-ink-50">
      <KioskHeader />
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside
          className={`${
            open ? 'block' : 'hidden'
          } fixed inset-y-0 left-0 z-40 mt-[57px] w-64 border-r border-ink-100 bg-white sm:relative sm:mt-0 sm:block sm:shrink-0`}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mx-3 mt-2 rounded-xl bg-ink-50 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-ink-500">
              <BookOpen size={14} />
              Yönetici Paneli
            </p>
          </div>
        </aside>

        {/* Mobile toggle */}
        <div className="sm:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft"
          >
            <LayoutDashboard size={22} />
          </button>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminPage({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AdminPinGate onSuccess={() => setAuthed(true)} />;
  return <AdminLayout>{children}</AdminLayout>;
}
