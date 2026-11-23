import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useReports } from "../context/ReportContext";
import { getStatusStyle } from "../utils/formatters";
import Card3D from "../components/ui/Card3D";

export default function TrackingPage() {
  const { reports } = useReports();
  const [query, setQuery] = useState("");

  const filtered = reports.filter(
    (r) =>
      r.id.toLowerCase().includes(query.toLowerCase()) ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.location.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Lacak Status Laporan
        </h2>
        <p className="text-xs text-slate-500">
          Cari berdasarkan nomor tiket (misal: SF-2026-001) atau lokasi.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Ketik nomor tiket atau nama jalan..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card3D key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
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
            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
            <p className="text-xs text-slate-500">{item.description}</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />{" "}
                {item.location}
              </span>
              <span>{item.createdAt}</span>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
}
