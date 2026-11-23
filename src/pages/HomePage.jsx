import {
  Construction,
  Lightbulb,
  Waves,
  Trees,
  Bus,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useReports } from "../context/ReportContext";
import { FACILITY_CATEGORIES } from "../data/mockReports";
import { getStatusStyle } from "../utils/formatters";
import Card3D from "../components/ui/Card3D";
import Button3D from "../components/ui/Button3D";
import IsometricHero3D from "../components/ui/IsometricHero3D";

const ICON_MAP = { Construction, Lightbulb, Waves, Trees, Bus };

export default function HomePage({ onNavigate }) {
  const { reports, user } = useReports();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">Selamat datang,</p>
          <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Kota Bandung
        </span>
      </div>

      {/* Banner Promo Card 3D */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-5 shadow-[0_16px_32px_rgba(15,23,42,0.22)] relative overflow-hidden">
        <div className="relative z-10 max-w-[65%]">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider mb-2">
            Respon Cepat 24 Jam
          </span>
          <h3 className="text-lg font-bold leading-snug">
            Lihat Jalan Rusak atau Lampu Mati?
          </h3>
          <p className="text-xs text-slate-300 mt-1 mb-4">
            Kirim foto dan lokasi, petugas langsung bergerak.
          </p>
          <Button3D
            variant="amber"
            onClick={() => onNavigate("lapor")}
            className="!py-2.5 !text-xs"
          >
            Buat Laporan <ArrowRight className="w-4 h-4" />
          </Button3D>
        </div>
        <div className="absolute -right-8 -bottom-4 w-44 opacity-95 pointer-events-none">
          <IsometricHero3D />
        </div>
      </div>

      {/* Kategori Fasilitas */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Kategori Fasilitas
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {FACILITY_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon];
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate("lapor")}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md group-hover:-translate-y-1 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Laporan Terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">
            Laporan Warga Terbaru
          </h3>
          <button
            onClick={() => onNavigate("lacak")}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Lihat semua
          </button>
        </div>

        <div className="space-y-3">
          {reports.map((item) => (
            <Card3D key={item.id} className="flex gap-3.5 items-center">
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-600">
                    {item.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {item.location}
                </p>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </div>
  );
}
