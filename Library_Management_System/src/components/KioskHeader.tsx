import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';

export function KioskHeader() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <BookOpen size={22} />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-ink-900">
              Kütüphane & Etüt
            </p>
            <p className="text-xs text-ink-500">Yönetim Sistemi</p>
          </div>
        </Link>
        <Link
          to={isAdmin ? '/' : '/admin'}
          className="btn-secondary text-sm"
        >
          <ShieldCheck size={16} />
          {isAdmin ? 'Öğrenci Kiosk' : 'Yönetici'}
        </Link>
      </div>
    </header>
  );
}
