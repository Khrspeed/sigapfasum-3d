import { useState } from "react";
import { Camera, MapPin, Send, CheckCircle2 } from "lucide-react";
import { useReports } from "../context/ReportContext";
import { FACILITY_CATEGORIES } from "../data/mockReports";
import Card3D from "../components/ui/Card3D";
import Button3D from "../components/ui/Button3D";

export default function ReportFormPage({ onSuccess }) {
  const { addReport, user } = useReports();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("jalan");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !location) return;
    const result = addReport({
      title,
      category,
      location,
      description,
      reporter: user.name,
    });
    setCreatedTicket(result);
  };

  if (createdTicket) {
    return (
      <div className="max-w-lg mx-auto mt-6">
        <Card3D className="text-center py-8 px-6 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Laporan Terkirim!
          </h2>
          <p className="text-xs text-slate-500">
            Simpan nomor tiket di bawah untuk memantau progres perbaikan di
            Kabupaten Kudus:
          </p>
          <div className="py-3 px-4 rounded-2xl bg-slate-100 font-mono text-lg font-extrabold text-blue-600">
            {createdTicket.id}
          </div>
          <Button3D onClick={onSuccess}>Kembali ke Beranda</Button3D>
        </Card3D>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
          Buat Pengaduan Baru
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Isi detail kerusakan fasilitas umum di wilayah Kabupaten Kudus dengan
          jelas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card3D className="p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Kerusakan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Trotoar Amblas Depan Alun-Alun Kudus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FACILITY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lokasi Kejadian (Kudus)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Nama jalan, desa, atau kecamatan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi Singkat
            </label>
            <textarea
              rows="3"
              placeholder="Jelaskan kondisi kerusakan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
            <Camera className="w-6 h-6 text-blue-500" />
            <span>Foto otomatis dilampirkan (Mode Simulasi)</span>
          </div>
        </Card3D>

        <Button3D type="submit">
          <Send className="w-4 h-4" /> Kirim Pengaduan Sekarang
        </Button3D>
      </form>
    </div>
  );
}
