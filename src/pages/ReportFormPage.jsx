import { useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
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

// Fungsi kompresi foto agar ringan & aman disimpan di browser / dikirim ke API
function compressImageFile(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportFormPage({ onSuccess }) {
  const { addReport, user } = useReports() || {};
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('jalan');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');

  // State Kamera & Foto
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // State Share Lokasi GPS
  const [coords, setCoords] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setPhotoPreview(compressedDataUrl);
    } catch {
      alert('Gagal memproses foto. Silakan coba ambil ulang.');
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

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
          setLocError(
            'Izin lokasi ditolak. Klik ikon gembok di samping alamat web lalu pilih "Allow / Izinkan" pada Lokasi.'
          );
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
    if (!title || !coords || !photoPreview) return;

    const finalLocation = locationDetail.trim() || detectedAddress || `${coords.lat}, ${coords.lng}`;

    const result = addReport({
      title,
      category,
      location: finalLocation,
      coords: { lat: coords.lat, lng: coords.lng },
      mapUrl,
      isGpsVerified: true,
      description,
      image: photoPreview,
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
          <h2 className="text-xl font-extrabold text-slate-900">Laporan, Foto & GPS Terkirim!</h2>
          <p className="text-xs text-slate-500">
            Bukti foto lapangan dan koordinat GPS sudah terkunci pada nomor tiket berikut:
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

  const isReadyToSubmit = Boolean(coords && photoPreview && title.trim());

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Buat Pengaduan Baru</h2>
        <p className="text-xs md:text-sm text-slate-500">
          Lampirkan foto bukti kerusakan dan kunci titik lokasi GPS di Kabupaten Kudus.
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

          {/* Bagian Share Lokasi GPS */}
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

          {/* Bagian Kamera & Upload Bukti Foto */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Foto Bukti Kerusakan (Wajib)
            </label>

            {/* Input tersembunyi untuk Kamera Langsung & Galeri */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {photoLoading ? (
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center text-xs text-blue-600 flex flex-col items-center gap-2 bg-blue-50/40">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Memproses dan mengompresi foto...</span>
              </div>
            ) : photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={photoPreview}
                  alt="Pratinjau Bukti Kerusakan"
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 bg-white flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Foto siap dilampirkan
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      Foto Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50/70 space-y-3 text-center">
                <p className="text-xs text-slate-500">
                  Ambil foto langsung dari kamera di lokasi atau pilih gambar dari perangkat:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Buka Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" /> Pilih dari Galeri
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card3D>

        <Button3D
          type="submit"
          disabled={!isReadyToSubmit}
          className={!isReadyToSubmit ? 'opacity-50 !cursor-not-allowed' : ''}
        >
          <Send className="w-4 h-4" />
          {!coords
            ? 'Kunci Lokasi GPS Dulu'
            : !photoPreview
            ? 'Lampirkan Foto Bukti Dulu'
            : 'Kirim Pengaduan Sekarang'}
        </Button3D>
      </form>
    </div>
  );
}