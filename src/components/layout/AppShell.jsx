import {
  Home,
  PlusCircle,
  Search,
  ShieldCheck,
  Wifi,
  Battery,
} from "lucide-react";

export default function AppShell({ activeTab, onChangeTab, children }) {
  const menus = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "lapor", label: "Lapor", icon: PlusCircle },
    { id: "lacak", label: "Lacak", icon: Search },
    { id: "admin", label: "Petugas", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center sm:py-6">
      <div className="w-full sm:w-[400px] h-screen sm:h-[820px] bg-slate-50 sm:rounded-[52px] sm:border-[12px] sm:border-slate-950 sm:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.15)] flex flex-col relative overflow-hidden">
        {/* Status Bar & Dynamic Island (Tampil di Laptop/Desktop) */}
        <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-2 bg-slate-50 z-40 select-none">
          <span className="text-xs font-bold text-slate-900">11:33</span>
          <div className="w-28 h-7 bg-slate-950 rounded-full flex items-center justify-end px-2.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-900">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Konten Halaman */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
          {children}
        </main>

        {/* Bottom Navigation Bar 3D */}
        <nav className="absolute bottom-5 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-[0_12px_30px_rgba(15,23,42,0.14)] px-3 py-2 flex justify-around items-center z-50">
          {menus.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 -translate-y-1"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Home Indicator Bar */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/80 rounded-full z-50" />
      </div>
    </div>
  );
}
