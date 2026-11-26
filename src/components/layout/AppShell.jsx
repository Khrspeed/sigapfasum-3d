import { useState } from 'react';
import { Home, PlusCircle, Search, MapPin, LogIn, LogOut } from 'lucide-react';
import { useReports } from '../../context/ReportContext';
import AuthModal from '../ui/AuthModal';

export default function AppShell({ activeTab, onChangeTab, children }) {
  const { user, logoutUser } = useReports();
  const [authOpen, setAuthOpen] = useState(false);

  const menus = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'lapor', label: 'Buat Laporan', icon: PlusCircle },
    { id: 'lacak', label: 'Lacak Laporan', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col pb-24 md:pb-10">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <button
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-extrabold flex items-center justify-center shadow-md shadow-blue-500/30">
              SF
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Sigap<span className="text-blue-600">Fasum</span>
            </span>
          </button>

          {/* Menu Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {menus.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Wilayah & Tombol Akun Warga */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              <MapPin className="w-3.5 h-3.5" />
              Kabupaten Kudus
            </span>

            {user ? (
              <div className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-slate-100 border border-slate-200">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        {children}
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-[0_12px_30px_rgba(15,23,42,0.14)] px-3 py-2 flex justify-around items-center z-50">
        {menus.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 -translate-y-1'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}