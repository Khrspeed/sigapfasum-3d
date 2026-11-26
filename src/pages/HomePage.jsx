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
    <div className="space-y-8">
      {/* Banner Hero 3D */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 md:p-10 shadow-[0_18px_40px_rgba(15,23,42,0.2)] grid grid-cols-1 md:grid-cols-12 items-center gap-6 overflow-hidden">
        <div className="md:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
              Respon Cepat 24 Jam
            </span>
            <span className="text-xs text-slate-300">
                 Halo, {user ? user.name : 'Warga Kudus'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
            Laporkan Kerusakan Fasilitas Umum di{" "}
            <span className="text-amber-400">Kudus</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Bantu wujudkan lingkungan Kabupaten Kudus yang lebih aman dan
            nyaman. Kirim foto dan lokasi kerusakan, tim petugas segera
            menindaklanjuti.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md">
            <Button3D variant="amber" onClick={() => onNavigate("lapor")}>
              Buat Laporan Sekarang <ArrowRight className="w-4 h-4" />
            </Button3D>
          </div>
        </div>

        <div className="md:col-span-5 flex justify-center">
          <div className="scale-110 md:scale-125">
            <IsometricHero3D />
          </div>
        </div>
      </div>

      {/* Kategori Fasilitas */}
      <div>
        <h2 className="text-base md:text-lg font-extrabold text-slate-800 mb-4">
          Kategori Fasilitas Umum
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {FACILITY_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon];
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate("lapor")}
                className="card-3d rounded-2xl p-4 flex flex-col items-center gap-2.5 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md group-hover:-translate-y-1 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-700 text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Laporan Terbaru (Grid 1 Kolom Mobile, 3 Kolom Desktop) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-extrabold text-slate-800">
            Laporan Warga Kudus Terbaru
          </h2>
          <button
            onClick={() => onNavigate("lacak")}
            className="text-xs md:text-sm font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Lihat semua laporan &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((item) => (
            <Card3D
              key={item.id}
              className="flex flex-col justify-between gap-3"
            >
              <div>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-44 rounded-2xl object-cover mb-3 shadow-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-600">
                    {item.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusStyle(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1.5 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </span>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </div>
  );
}
