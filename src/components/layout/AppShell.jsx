import { useState } from 'react';
import { Home, PlusCircle, Search, MapPin, LogIn, LogOut } from 'lucide-react';
import { useReports } from '../../context/ReportContext';
import AuthModal from '../ui/AuthModal';

export default function AppShell({ activeTab, onChangeTab, children }) {
  const { user, logoutUser } = useReports() || {};
  const [authOpen, setAuthOpen] = useState(false);

  const menus = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'lapor', label: 'Buat Laporan', icon: PlusCircle },
    { id: 'lacak', label: 'Lacak Laporan', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col pb-28">
      {/* Header Atas Bersih (Logo + Wilayah + Akun Warga) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo 3D */}
          <button
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-extrabold flex items-center justify-center shadow-[0_4px_0_#1d4ed8,0_8px_16px_rgba(37,99,235,0.35)] group-active:translate-y-0.5 transition-all">
              SF
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Sigap<span className="text-blue-600">Fasum</span>
            </span>
          </button>

          {/* Wilayah & Tombol Akun Warga */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100/90 text-blue-700 border border-blue-200/60">
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kabupaten Kudus</span>
              <span className="sm:hidden">Kudus</span>
            </span>

            {user ? (
              <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-slate-100 border border-slate-200 shadow-2xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={logoutUser}
                  title="Keluar Akun"
                  className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-white transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-sm transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        {children}
      </main>

      {/* Floating 3D Bottom Dock (Tampil Melayang di Desktop & Mobile) */}
      <nav
        aria-label="Navigasi Utama"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 border-b-[5px] border-b-slate-300/90 rounded-3xl shadow-[0_20px_40px_-10px_rgba(15,23,42,0.22),0_4px_14px_rgba(37,99,235,0.1)] px-3 py-2 flex items-center justify-around gap-1.5"
      >
        {menus.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white -translate-y-2.5 scale-[1.03] shadow-[0_6px_0_#1d4ed8,0_12px_20px_rgba(37,99,235,0.45)]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:translate-y-0.5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] sm:text-xs font-extrabold tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}