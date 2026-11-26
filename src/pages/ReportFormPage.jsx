import { useState } from 'react';
import {
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useReports } from '../context/ReportContext';
import { FACILITY_CATEGORIES } from '../data/mockReports';
import Card3D from '../components/ui/Card3D';
import Button3D from '../components/ui/Button3D';

export default function ReportFormPage({ onSuccess }) {
  const { addReport, user } = useReports();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('jalan');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');

  // State khusus Share Lokasi GPS (Anti Laporan Palsu)
  const [coords, setCoords] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Browser ini tidak mendukung fitur GPS.');
      return;
    }

    setLocLoading(true);
    setLocError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        setCoords({ lat, lng, accuracy });

        // Terjemahkan koordinat menjadi nama jalan/desa otomatis
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data && data.display_name) {
            const shortAddr = data.display_name.split(',').slice(0, 4).join(', ');
            setDetectedAddress(shortAddr);
            if (!locationDetail) setLocationDetail(shortAddr);
          }
        } catch {
          setDetectedAddress(`Koordinat GPS (${lat}, ${lng})`);
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) {
          setLocError('Izin lokasi ditolak. Klik ikon gembok di samping alamat web lalu pilih "Allow / Izinkan" pada Lokasi.');
        } else {
          setLocError('Gagal mendeteksi titik GPS. Pastikan GPS/Lokasi perangkat aktif lalu coba lagi.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const mapUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !coords) return;

    const finalLocation = locationDetail.trim() || detectedAddress || `${coords.lat}, ${coords.lng}`;

    const result = addReport({
      title,
      category,
      location: finalLocation,
      coords: { lat: coords.lat, lng: coords.lng },
      mapUrl,
      isGpsVerified: true,
      description,
      reporter: user ? user.name : 'Warga Kudus',
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
          <h2 className="text-xl font-extrabold text-slate-900">Laporan & Titik GPS Terkirim!</h2>
          <p className="text-xs text-slate-500">
            Lokasi GPS asli sudah terkunci dan dapat langsung dibuka petugas di Google Maps:
          </p>
          <div className="py-3 px-4 rounded-2xl bg-slate-100 font-mono text-lg font-extrabold text-blue-600">
            {createdTicket.id}
          </div>
          {createdTicket.mapUrl && (
            <a
              href={createdTicket.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Cek Titik Lokasi di Google Maps
            </a>
          )}
          <Button3D onClick={onSuccess}>Kembali ke Beranda</Button3D>
        </Card3D>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Buat Pengaduan Baru</h2>
        <p className="text-xs md:text-sm text-slate-500">
          Wajib bagikan titik lokasi GPS langsung dari tempat kejadian agar laporan valid.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card3D className="p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Kerusakan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Trotoar Amblas Depan Alun-Alun Kudus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori Fasilitas</label>
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

          {/* Bagian Share Lokasi ala WhatsApp */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Titik Lokasi Kejadian (Wajib GPS)
              </label>
              {coords && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> GPS Terkunci (±{coords.accuracy}m)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleShareLocation}
              disabled={locLoading}
              className={`w-full py-3 px-4 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                coords
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {locLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mendeteksi Titik GPS...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  {coords ? 'Perbarui Titik Lokasi GPS' : 'Share Lokasi GPS Saat Ini'}
                </>
              )}
            </button>

            {locError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{locError}</span>
              </div>
            )}

            {/* Pratinjau Mini Map + Pin Lokasi */}
            {coords && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 space-y-2">
                <iframe
                  title="Pratinjau Lokasi GPS"
                  src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`}
                  className="w-full h-44 border-0"
                  loading="lazy"
                />
                <div className="px-3.5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[11px] text-slate-600">
                    Koordinat: <strong>{coords.lat}, {coords.lng}</strong>
                  </span>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                  >
                    Buka di Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Detail Patokan Alamat */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Patokan tambahan (misal: Depan Indomaret / Sebelah Utara Lampu Merah)"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Singkat</label>
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

        <Button3D
          type="submit"
          disabled={!coords}
          className={!coords ? 'opacity-50 !cursor-not-allowed' : ''}
        >
          <Send className="w-4 h-4" />
          {coords ? 'Kirim Pengaduan Sekarang' : 'Kunci Lokasi GPS Dulu untuk Mengirim'}
        </Button3D>
      </form>
    </div>
  );
}