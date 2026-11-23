import { useState } from "react";
import { Lock } from "lucide-react";
import { useReports } from "../context/ReportContext";
import { getStatusStyle } from "../utils/formatters";
import Card3D from "../components/ui/Card3D";
import Button3D from "../components/ui/Button3D";

export default function AdminPage() {
  const { reports, changeStatus } = useReports();
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);

  if (!authorized) {
    return (
      <Card3D className="mt-8 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Akses Khusus Petugas
        </h2>
        <p className="text-xs text-slate-500">
          Masukkan PIN Petugas untuk memperbarui status laporan.
        </p>
        <input
          type="password"
          placeholder="Masukkan PIN (Default: 1234)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-sm tracking-widest"
        />
        <Button3D
          onClick={() => {
            if (pin === "1234") setAuthorized(true);
            else alert("PIN salah!");
          }}
        >
          Masuk Panel Petugas
        </Button3D>
      </Card3D>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">
          Panel Tindak Lanjut
        </h2>
        <button
          onClick={() => setAuthorized(false)}
          className="text-xs font-semibold text-red-500 cursor-pointer"
        >
          Keluar
        </button>
      </div>

      {reports.map((item) => (
        <Card3D key={item.id} className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-600">{item.id}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(item.status)}`}
            >
              {item.status}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["Menunggu", "Diproses", "Selesai"].map((st) => (
              <button
                key={st}
                onClick={() => changeStatus(item.id, st)}
                className={`py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                  item.status === st
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </Card3D>
      ))}
    </div>
  );
}
