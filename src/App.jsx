import { useEffect, useRef, useState } from 'react';
import {
  Home,
  PlusCircle,
  Search,
  LogIn,
  LogOut,
  MapPin,
  ExternalLink,
  Moon,
  Sun,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowUpDown,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Send,
  Download,
  X,
  Sparkles,
  Crosshair,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  INITIAL_CITIZEN_REPORTS,
  KUDUS_CATEGORIES,
  OFFICER_DIRECTORY,
  PRIORITY_LEVELS,
  detectAutoPriority,
  getPriorityMeta,
  getReportPriority,
  sanitizeText,
  sortReportsByPriority,
  validateKudusGeofence,
  validateReportContent,
} from './data/adminMockData';

const STORAGE_REPORTS_KEY = 'sigapfasum_warga_reports_v3';
const STORAGE_USER_KEY = 'sigapfasum_warga_user_v3';
const STORAGE_SUBMISSION_LOG_KEY = 'sigapfasum_submission_log_v1';
const STORAGE_MY_TICKETS_KEY = 'sigapfasum_my_tickets_v1';

function createMathChallenge() {
  const a = Math.floor(Math.random() * 8) + 2; // 2..9
  const b = Math.floor(Math.random() * 8) + 1; // 1..8
  return { a, b, answer: a + b };
}

// Re-encode & kompres foto via Canvas untuk membersihkan metadata EXIF & membatasi ukuran
function sanitizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Format foto harus JPG, PNG, atau WEBP.'));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error('Ukuran foto maksimal 3 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1080;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar di browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const cleanedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(cleanedDataUrl);
      };
      img.onerror = () => reject(new Error('File gambar rusak atau tidak valid.'));
      img.src = String(ev.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Abaikan error storage
    }
    return INITIAL_CITIZEN_REPORTS;
  });

  const [myTicketIds, setMyTicketIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MY_TICKETS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [citizenUser, setCitizenUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
    } catch {
      // Abaikan kuota penuh
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MY_TICKETS_KEY, JSON.stringify(myTicketIds));
    } catch {
      // Abaikan error storage
    }
  }, [myTicketIds]);

  useEffect(() => {
    try {
      if (citizenUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(citizenUser));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // Abaikan error storage
    }
  }, [citizenUser]);

  const [menu, setMenu] = useState('beranda');
  const [darkMode, setDarkMode] = useState(false);

  // Filter Lacak Laporan
  const [statusFilter, setStatusFilter] = useState('semua');
  const [priorityFilter, setPriorityFilter] = useState('semua');
  const [onlyMyReports, setOnlyMyReports] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(true);
  const [search, setSearch] = useState('');

  // Form Buat Laporan + Geofence + Anti-Bot
  const [formCategory, setFormCategory] = useState(KUDUS_CATEGORIES[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState(KUDUS_CATEGORIES[0].defaultPriority);
  const [isManualPriority, setIsManualPriority] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formCoords, setFormCoords] = useState(null);
  const [gpsState, setGpsState] = useState('idle');
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formReporterName, setFormReporterName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [imageStatusText, setImageStatusText] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);
  const [honeypotTrap, setHoneypotTrap] = useState('');
  const [mathChallenge, setMathChallenge] = useState(() => createMathChallenge());
  const [mathInput, setMathInput] = useState('');
  const [formOpenedAt, setFormOpenedAt] = useState(() => Date.now());
  const [formNotice, setFormNotice] = useState(null);

  // Modal Detail & Modal Login Google
  const [detailReport, setDetailReport] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const photoInputRef = useRef(null);

  useEffect(() => {
    if (citizenUser?.name && !formReporterName) {
      setFormReporterName(citizenUser.name);
    }
  }, [citizenUser, formReporterName]);

  const openReportForm = () => {
    setFormOpenedAt(Date.now());
    setMathChallenge(createMathChallenge());
    setMathInput('');
    setMenu('lapor');
  };

  // Reverse Geocoding Koordinat -> Nama Jalan & Kecamatan Asli
  const resolveAddressFromCoords = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address || {};
      const parts = [
        addr.road || addr.pedestrian || addr.footway || addr.neighbourhood,
        addr.village || addr.suburb || addr.hamlet,
        addr.city_district || addr.district || addr.county,
        addr.city || addr.town || 'Kabupaten Kudus',
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : data?.display_name || null;
    } catch {
      return null;
    }
  };

  const requestPosition = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

  // Verifikasi GPS Ketat Tanpa Pengalihan Lokasi Palsu
  const handleStrictGpsVerification = async () => {
    setFormNotice(null);
    setFormCoords(null);

    if (!navigator.geolocation) {
      setGpsState('blocked');
      setGpsStatusText(
        'Akses Ditolak: Browser Anda tidak mendukung layanan GPS. Pelaporan tidak dapat dilanjutkan.'
      );
      return;
    }

    setGpsState('scanning');
    setGpsStatusText('Memverifikasi koordinat GPS perangkat Anda...');

    let position = null;

    try {
      position = await requestPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });
    } catch {
      try {
        setGpsStatusText('Mengambil sinyal lokasi jaringan perangkat...');
        position = await requestPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0,
        });
      } catch (err) {
        setGpsState('blocked');
        setFormCoords(null);
        if (err?.code === 1) {
          setGpsStatusText(
            'Akses Ditolak: Izin lokasi GPS diblokir. Aktifkan izin lokasi di browser untuk membuktikan Anda berada di Kabupaten Kudus.'
          );
        } else {
          setGpsStatusText(
            'Verifikasi Gagal: Sinyal GPS tidak terbaca. Aktifkan GPS perangkat dan coba lagi di area terbuka.'
          );
        }
        return;
      }
    }

    const lat = Number(position.coords.latitude.toFixed(6));
    const lng = Number(position.coords.longitude.toFixed(6));
    const accuracy = Math.round(position.coords.accuracy || 999);

    const check = validateKudusGeofence(lat, lng, accuracy);

    if (!check.allowed) {
      setGpsState('blocked');
      setFormCoords(null);

      if (check.reason === 'outside_kudus') {
        setGpsStatusText(
          `Akses Ditolak: Lokasi Anda terdeteksi ${check.distanceKm} km dari pusat Kabupaten Kudus (di luar jangkauan layanan). GPS hanya mendeteksi area sekitar Kabupaten Kudus.`
        );
      } else if (check.reason === 'low_accuracy') {
        setGpsStatusText(
          `Verifikasi Ditolak: Akurasi lokasi terlalu rendah (±${accuracy} meter / terindikasi VPN/IP). Aktifkan GPS Akurat pada perangkat Anda.`
        );
      } else {
        setGpsStatusText('Koordinat lokasi tidak valid. Pelaporan diblokir.');
      }
      return;
    }

    setFormCoords({
      lat,
      lng,
      accuracy,
      distanceKm: check.distanceKm,
    });
    setGpsState('locked');
    setGpsStatusText(
      `Terverifikasi di wilayah Kabupaten Kudus (akurasi ±${accuracy} meter)`
    );

    const resolvedAddress = await resolveAddressFromCoords(lat, lng);
    if (resolvedAddress) {
      setFormLocation(resolvedAddress);
    } else if (!formLocation.trim()) {
      setFormLocation(`Titik Terverifikasi (${lat}, ${lng}), Kabupaten Kudus`);
    }
  };

  const navTabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'lapor', label: 'Buat Laporan', icon: PlusCircle },
    { id: 'lacak', label: 'Lacak Laporan', icon: Search },
  ];

  // Hanya laporan terverifikasi yang tampil di halaman depan publik
  const publicVerifiedReports = reports.filter(
    (r) => r.status !== 'Menunggu Verifikasi'
  );

  const stats = {
    total: publicVerifiedReports.length,
    ditugaskan: publicVerifiedReports.filter((r) => r.status === 'Ditugaskan').length,
    penanganan: publicVerifiedReports.filter((r) => r.status === 'Dalam Penanganan')
      .length,
    selesai: publicVerifiedReports.filter((r) => r.status === 'Laporan Selesai').length,
  };

  const completionPercent =
    stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;

  const handleCategoryChange = (newCat) => {
    setFormCategory(newCat);
    if (!isManualPriority) {
      setFormPriority(detectAutoPriority(newCat, formTitle));
    }
  };

  const handleTitleChange = (newTitle) => {
    setFormTitle(newTitle);
    if (!isManualPriority) {
      setFormPriority(detectAutoPriority(formCategory, newTitle));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormNotice(null);
    setImageStatusText('Memvalidasi & membersihkan metadata foto...');

    try {
      const cleanImage = await sanitizeAndCompressImage(file);
      setFormImage(cleanImage);
      setImageStatusText('Foto bukti terverifikasi siap dilampirkan.');
    } catch (err) {
      setFormImage('');
      setImageStatusText('');
      setFormNotice({
        type: 'error',
        text: err?.message || 'Foto bukti tidak valid.',
      });
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    setFormNotice(null);

    // 1. Cek Honeypot Anti-Bot
    if (honeypotTrap.trim() !== '') {
      return;
    }

    // 2. Cek Kecepatan Ketik Manusia (minimal 5 detik sejak buka form)
    if (Date.now() - formOpenedAt < 5000) {
      setFormNotice({
        type: 'error',
        text: 'Terdeteksi aktivitas otomatis: Mohon isi formulir laporan secara wajar.',
      });
      return;
    }

    // 3. Cek Jawaban Verifikasi Matematika Anti-Bot
    if (Number(mathInput.trim()) !== mathChallenge.answer) {
      setFormNotice({
        type: 'error',
        text: `Jawaban verifikasi keamanan salah (${mathChallenge.a} + ${mathChallenge.b} = ${mathChallenge.answer}). Silakan coba lagi.`,
      });
      setMathChallenge(createMathChallenge());
      setMathInput('');
      return;
    }

    // 4. Validasi Geofence Kabupaten Kudus (Anti-Bypass)
    if (!formCoords || gpsState !== 'locked') {
      setFormNotice({
        type: 'error',
        text: 'Pelaporan diblokir: GPS hanya mendeteksi area sekitar Kabupaten Kudus.',
      });
      return;
    }

    const strictCheck = validateKudusGeofence(
      formCoords.lat,
      formCoords.lng,
      formCoords.accuracy
    );
    if (!strictCheck.allowed) {
      setGpsState('blocked');
      setFormCoords(null);
      setFormNotice({
        type: 'error',
        text: 'Akses Ditolak: Koordinat berada di luar jangkauan wilayah Kabupaten Kudus.',
      });
      return;
    }

    // 5. Validasi Anti-Iklan, Anti-Link & Kualitas Teks
    const contentCheck = validateReportContent(
      formTitle,
      formDescription,
      formLocation
    );
    if (!contentCheck.valid) {
      setFormNotice({
        type: 'error',
        text: contentCheck.error,
      });
      return;
    }

    // 6. Wajib Foto Bukti Lapangan
    if (!formImage) {
      setFormNotice({
        type: 'error',
        text: 'Wajib mengunggah foto bukti kerusakan di lapangan (maksimal 3 MB).',
      });
      return;
    }

    if (!humanVerified) {
      setFormNotice({
        type: 'error',
        text: 'Centang pernyataan pertanggungjawaban laporan terlebih dahulu.',
      });
      return;
    }

    // 7. Rate Limiting (Jeda 30 detik & Maksimal 5 laporan / 24 jam)
    const now = Date.now();
    let history = [];
    try {
      const raw = localStorage.getItem(STORAGE_SUBMISSION_LOG_KEY);
      history = raw ? JSON.parse(raw) : [];
    } catch {
      history = [];
    }

    const last24h = history.filter((ts) => now - ts < 24 * 60 * 60 * 1000);
    if (last24h.length > 0 && now - last24h[last24h.length - 1] < 30000) {
      setFormNotice({
        type: 'error',
        text: 'Terlalu cepat: Tunggu 30 detik sebelum mengirim laporan berikutnya.',
      });
      return;
    }

    if (last24h.length >= 5) {
      setFormNotice({
        type: 'error',
        text: 'Batas keamanan tercapai: Maksimal 5 laporan per 24 jam dari perangkat ini.',
      });
      return;
    }

    const ticketId = `SF-2026-${String(reports.length + 1).padStart(3, '0')}`;
    const reporterFinalName = sanitizeText(
      citizenUser?.name || formReporterName || 'Warga Kudus'
    );

    const newReport = {
      id: ticketId,
      title: sanitizeText(formTitle),
      category: formCategory,
      priority: formPriority,
      location: sanitizeText(formLocation),
      mapUrl: `https://www.google.com/maps?q=${formCoords.lat},${formCoords.lng}`,
      description: sanitizeText(formDescription),
      status: 'Menunggu Verifikasi',
      assignedOfficers: [],
      reporter: reporterFinalName || 'Warga Kudus',
      reporterEmail: citizenUser?.email || '',
      createdAt: new Date().toISOString(),
      image: formImage,
    };

    setReports((prev) => [newReport, ...prev]);
    setMyTicketIds((prev) => [ticketId, ...prev]);

    try {
      localStorage.setItem(
        STORAGE_SUBMISSION_LOG_KEY,
        JSON.stringify([...last24h, now])
      );
    } catch {
      // Abaikan error storage
    }

    setFormTitle('');
    setFormDescription('');
    setFormImage('');
    setImageStatusText('');
    setIsManualPriority(false);
    setHumanVerified(false);
    setMathChallenge(createMathChallenge());
    setMathInput('');
    setFormOpenedAt(Date.now());

    setFormNotice({
      type: 'success',
      text: `Laporan terverifikasi terkirim (${ticketId})! Laporan akan tampil ke publik setelah lolos verifikasi Admin dan dapat dipantau di menu "Laporan Saya".`,
    });
    setDetailReport(newReport);
  };

  const handleGoogleLoginSubmit = (e) => {
    e.preventDefault();
    const name = sanitizeText(googleNameInput) || 'Ahmad Maulana';
    const email =
      sanitizeText(googleEmailInput) ||
      `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    setCitizenUser({ name, email, provider: 'Google' });
    setFormReporterName(name);
    setIsLoginModalOpen(false);
  };

  const handleDownloadTicketJson = (report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tiket-${report.id.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isOwnReport = (r) => {
    if (myTicketIds.includes(r.id)) return true;
    if (citizenUser) {
      if (r.reporterEmail && r.reporterEmail === citizenUser.email) return true;
      if (r.reporter.toLowerCase() === citizenUser.name.toLowerCase()) return true;
    }
    return false;
  };

  const baseFilteredReports = reports.filter((r) => {
    const query = search.trim().toLowerCase();
    const isExactTicketLookup =
      query.startsWith('sf-2026-') && r.id.toLowerCase() === query;

    // Moderasi Pra-Tayang: Sembunyikan 'Menunggu Verifikasi' dari publik kecuali milik sendiri atau dicari persis dengan nomor tiket
    if (
      r.status === 'Menunggu Verifikasi' &&
      !isOwnReport(r) &&
      !isExactTicketLookup
    ) {
      return false;
    }

    if (onlyMyReports && !isOwnReport(r)) {
      return false;
    }

    const matchText =
      r.id.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query);
    if (!matchText) return false;

    if (priorityFilter !== 'semua' && getReportPriority(r) !== priorityFilter) {
      return false;
    }

    if (statusFilter === 'ditugaskan') return r.status === 'Ditugaskan';
    if (statusFilter === 'penanganan') return r.status === 'Dalam Penanganan';
    if (statusFilter === 'selesai') return r.status === 'Laporan Selesai';
    return true;
  });

  const filteredReports = sortByPriority
    ? sortReportsByPriority(baseFilteredReports)
    : baseFilteredReports;

  const isSubmitUnlocked = Boolean(formCoords && gpsState === 'locked');

  const renderPriorityBadge = (report) => {
    const prio = getReportPriority(report);
    const meta = getPriorityMeta(prio);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        {meta.label}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    if (status === 'Laporan Selesai') {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600">
          {status}
        </span>
      );
    }
    if (status === 'Dalam Penanganan' || status === 'Ditugaskan') {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600">
          {status}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600/10 text-blue-600">
        {status}
      </span>
    );
  };

  const pageBg = darkMode
    ? 'bg-[#0b0f17] text-slate-100'
    : 'bg-[#f4f7fb] text-slate-900';
  const cardBg = darkMode
    ? 'bg-[#141b29] border-slate-800 text-slate-100'
    : 'bg-white border-slate-200/70 text-slate-900 bento-3d';
  const subCardBg = darkMode
    ? 'bg-[#1c2536] border-slate-700/70'
    : 'bg-[#f8fafc] border-slate-200/70';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 pb-28 ${pageBg}`}
    >
      {/* TOP HEADER SOLID-BLUR */}
      <header
        className={`sticky top-0 z-40 py-3 px-4 sm:px-8 border-b backdrop-blur-xl transition-colors ${
          darkMode
            ? 'bg-[#0b0f17]/90 border-slate-800/80'
            : 'bg-[#f4f7fb]/90 border-slate-200/70'
        }`}
      >
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => setMenu('beranda')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bento-blue-3d text-white font-extrabold flex items-center justify-center text-xs sm:text-sm">
              SF
            </div>
            <div className="text-left leading-tight">
              <span className="text-base sm:text-lg font-extrabold tracking-tight block">
                Sigap<span className="text-blue-600">Fasum</span>
              </span>
              <span className={`text-[10px] font-semibold block ${mutedText}`}>
                Kabupaten Kudus
              </span>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Ubah Tema Terang / Gelap"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition cursor-pointer ${
                darkMode
                  ? 'bg-[#141b29] border-slate-800 text-amber-400'
                  : 'bg-white border-slate-200/80 text-slate-600 shadow-xs'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {citizenUser ? (
              <div
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border ${
                  darkMode
                    ? 'bg-[#141b29] border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <button
                  onClick={() => {
                    setMenu('lacak');
                    setOnlyMyReports(true);
                  }}
                  title="Lihat Laporan Saya"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center justify-center">
                    {citizenUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-extrabold">
                    {citizenUser.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setCitizenUser(null);
                    setOnlyMyReports(false);
                  }}
                  title="Keluar Akun Google"
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Masuk Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1160px] mx-auto px-4 sm:px-8 pt-6 space-y-7">
        {/* VIEW 1: BERANDA */}
        {menu === 'beranda' && (
          <div className="space-y-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Kartu Hero Biru 3D */}
              <div className="lg:col-span-7 bento-blue-3d rounded-[28px] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl" />
                <div className="space-y-2.5 relative">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Geofence & Anti-Spam Aktif •
                    Kabupaten Kudus
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    {citizenUser
                      ? `Halo, ${citizenUser.name}! Ada Fasilitas Rusak di Sekitar Anda?`
                      : 'Laporkan Kerusakan Fasilitas Umum dengan Cepat & Terverifikasi'}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                    Dilengkapi verifikasi GPS khusus area Kabupaten Kudus, wajib foto
                    bukti lapangan, serta moderasi otomatis bebas spam.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-6 relative">
                  <button
                    onClick={openReportForm}
                    className="px-5 py-3 rounded-full bg-white text-blue-700 hover:bg-blue-50 text-xs font-extrabold flex items-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Buat Laporan Sekarang
                  </button>
                  <button
                    onClick={() => {
                      setOnlyMyReports(false);
                      setMenu('lacak');
                    }}
                    className="px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Search className="w-4 h-4" /> Lacak Laporan Publik
                  </button>
                </div>
              </div>

              {/* Kartu Ringkasan Status 3D */}
              <div
                className={`lg:col-span-5 rounded-[28px] border p-6 flex flex-col justify-between gap-4 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold">Status Penanganan Publik</h2>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Total {stats.total} laporan terverifikasi Admin
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600/10 text-blue-600">
                    {completionPercent}% Tuntas
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setStatusFilter('ditugaskan');
                      setOnlyMyReports(false);
                      setMenu('lacak');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition hover:border-blue-500/50 cursor-pointer ${subCardBg}`}
                  >
                    <Clock className="w-4 h-4 text-blue-600 mb-2" />
                    <p className="text-2xl font-extrabold">{stats.ditugaskan}</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${mutedText}`}>
                      Ditugaskan
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setStatusFilter('penanganan');
                      setOnlyMyReports(false);
                      setMenu('lacak');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition hover:border-amber-500/50 cursor-pointer ${subCardBg}`}
                  >
                    <Wrench className="w-4 h-4 text-amber-500 mb-2" />
                    <p className="text-2xl font-extrabold">{stats.penanganan}</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${mutedText}`}>
                      Diproses
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setStatusFilter('selesai');
                      setOnlyMyReports(false);
                      setMenu('lacak');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition hover:border-emerald-500/50 cursor-pointer ${subCardBg}`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-2" />
                    <p className="text-2xl font-extrabold">{stats.selesai}</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${mutedText}`}>
                      Selesai
                    </p>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bento-blue-3d transition-all duration-500"
                      style={{ width: `${Math.max(completionPercent, 12)}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-[11px] font-semibold ${mutedText}`}>
                    <span>{stats.selesai} fasilitas sudah diperbaiki</span>
                    <span>Kab. Kudus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daftar Laporan Terverifikasi Terkini */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold">
                    Laporan Fasilitas Umum Terverifikasi
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Hanya laporan valid yang sudah diverifikasi Admin yang tampil ke publik
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('semua');
                    setPriorityFilter('semua');
                    setOnlyMyReports(false);
                    setMenu('lacak');
                  }}
                  className="px-4 py-2 rounded-full bg-[#0f172a] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  Lihat Semua ({publicVerifiedReports.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortReportsByPriority(publicVerifiedReports)
                  .slice(0, 6)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setDetailReport(item)}
                      className={`rounded-[26px] border p-4 flex flex-col justify-between gap-3 cursor-pointer ${cardBg}`}
                    >
                      <div>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-40 object-cover rounded-2xl mb-3"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-blue-600">
                            {item.id}
                          </span>
                          {renderPriorityBadge(item)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {renderStatusBadge(item.status)}
                          <span className={`text-[11px] font-semibold ${mutedText}`}>
                            • {item.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold mt-2 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className={`text-xs mt-1 line-clamp-2 ${mutedText}`}>
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <span className={`flex items-center gap-1 truncate ${mutedText}`}>
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        <span className="text-blue-600 font-bold shrink-0">
                          Detail →
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FORM BUAT LAPORAN + KETERANGAN JANGKAUAN GPS */}
        {menu === 'lapor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={handleSubmitReport}
              className={`lg:col-span-8 rounded-[28px] border p-5 sm:p-7 space-y-5 ${cardBg}`}
            >
              {/* Honeypot tersembunyi untuk anti-bot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypotTrap}
                onChange={(e) => setHoneypotTrap(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold">
                    Buat Laporan Fasilitas Umum
                  </h2>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>
                    GPS hanya mendeteksi area sekitar Kabupaten Kudus.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                    isSubmitUnlocked
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-amber-500/15 text-amber-600'
                  }`}
                >
                  {isSubmitUnlocked ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Wilayah Kudus Terverifikasi
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Menunggu Kunci GPS Kudus
                    </>
                  )}
                </span>
              </div>

              {formNotice && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                    formNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      : 'bg-red-500/10 border-red-500/30 text-red-500'
                  }`}
                >
                  {formNotice.text}
                </div>
              )}

              {/* 1. Verifikasi Lokasi GPS */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  gpsState === 'blocked'
                    ? 'bg-red-500/5 border-red-500/40'
                    : gpsState === 'locked'
                    ? 'bg-emerald-500/5 border-emerald-500/40'
                    : subCardBg
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-extrabold">
                      1. Verifikasi Lokasi GPS
                    </label>
                    <p className={`text-[11px] mt-0.5 ${mutedText}`}>
                      Catatan: GPS hanya mendeteksi area sekitar Kabupaten Kudus.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStrictGpsVerification}
                    disabled={gpsState === 'scanning'}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer self-start shrink-0"
                  >
                    {gpsState === 'scanning' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3.5 h-3.5" />
                        {formCoords ? 'Verifikasi Ulang GPS' : 'Verifikasi Lokasi GPS'}
                      </>
                    )}
                  </button>
                </div>

                {gpsStatusText && (
                  <div
                    className={`p-3 rounded-xl text-[11px] font-bold flex items-start gap-2 leading-relaxed ${
                      gpsState === 'blocked'
                        ? 'bg-red-500/15 text-red-600'
                        : gpsState === 'scanning'
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'bg-emerald-500/15 text-emerald-600'
                    }`}
                  >
                    {gpsState === 'blocked' ? (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{gpsStatusText}</span>
                  </div>
                )}

                <input
                  type="text"
                  required
                  disabled={!isSubmitUnlocked}
                  placeholder={
                    isSubmitUnlocked
                      ? 'Detail alamat / patokan lokasi di Kudus...'
                      : 'Kunci lokasi GPS di sekitar Kabupaten Kudus terlebih dahulu...'
                  }
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 ${subCardBg}`}
                />

                {/* Pratinjau Peta Pin & Koordinat Terverifikasi */}
                {formCoords && gpsState === 'locked' && (
                  <div className={`rounded-2xl border overflow-hidden ${subCardBg}`}>
                    <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600">
                          ✓ {formCoords.lat}, {formCoords.lng}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600">
                          ±{formCoords.accuracy} m • {formCoords.distanceKm} km dr Pusat Kudus
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${formCoords.lat},${formCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-extrabold hover:underline inline-flex items-center gap-1"
                      >
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <iframe
                      title="Peta Lokasi GPS Terverifikasi"
                      className="w-full h-40 border-0"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        formCoords.lng - 0.003
                      }%2C${formCoords.lat - 0.002}%2C${formCoords.lng + 0.003}%2C${
                        formCoords.lat + 0.002
                      }&layer=mapnik&marker=${formCoords.lat}%2C${formCoords.lng}`}
                    />
                  </div>
                )}
              </div>

              {/* 2. Kategori */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold">
                  2. Kategori Fasilitas
                </label>
                <div className="flex flex-wrap gap-2">
                  {KUDUS_CATEGORIES.map((cat) => {
                    const active = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                          active
                            ? 'bento-blue-3d text-white border-blue-600'
                            : `${subCardBg} ${mutedText} hover:text-blue-600`
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Judul */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold">
                  3. Judul Laporan (Tanpa Link / Promosi)
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Contoh: Jalan Berlubang Depan Pasar Kliwon Kudus"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                />
              </div>

              {/* 4. Tingkat Prioritas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold">
                    4. Tingkat Prioritas
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                    <Sparkles className="w-3 h-3" />
                    {isManualPriority ? 'Dipilih manual' : 'Otomatis'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_LEVELS.map((lvl) => {
                    const isActive = formPriority === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setFormPriority(lvl.id);
                          setIsManualPriority(true);
                        }}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isActive
                            ? lvl.activeBtnClass
                            : `${subCardBg} ${mutedText} hover:border-blue-500/50`
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-white' : lvl.dotClass
                            }`}
                          />
                          <span className="text-xs font-extrabold">{lvl.label}</span>
                        </div>
                        <p
                          className={`text-[10px] mt-1 leading-tight ${
                            isActive ? 'text-white/90' : 'opacity-80'
                          }`}
                        >
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Deskripsi & Wajib Foto Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold">
                      5. Detail Kerusakan
                    </label>
                    <span className={`text-[10px] font-semibold ${mutedText}`}>
                      {formDescription.trim().length}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    maxLength={500}
                    placeholder="Jelaskan kondisi kerusakan secara jelas (min. 20 karakter, tanpa tautan/nomor WA)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold">
                      6. Foto Bukti Lapangan *
                    </label>
                    <span className="text-[10px] font-extrabold text-red-500">
                      Wajib (Maks 3MB)
                    </span>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className={`h-[104px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden ${
                      formImage
                        ? 'border-emerald-500/60'
                        : 'border-blue-500/40'
                    } ${subCardBg}`}
                  >
                    {formImage ? (
                      <img
                        src={formImage}
                        alt="Preview bukti"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-blue-600" />
                        <span className="text-[11px] font-bold">
                          Ambil / Unggah Foto Bukti
                        </span>
                        <span className={`text-[10px] ${mutedText}`}>
                          JPG, PNG, WEBP • Wajib ada bukti nyata
                        </span>
                      </>
                    )}
                  </div>
                  {imageStatusText && (
                    <p className="text-[10px] font-bold text-emerald-600">
                      ✓ {imageStatusText}
                    </p>
                  )}
                </div>
              </div>

              {/* 7. Pelapor, Tantangan Anti-Bot & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Nama Pelapor
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="Nama Anda (atau masuk Google)"
                    value={citizenUser ? citizenUser.name : formReporterName}
                    disabled={Boolean(citizenUser)}
                    onChange={(e) => setFormReporterName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs ${subCardBg}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Verifikasi Anti-Bot: {mathChallenge.a} + {mathChallenge.b} = ?
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ketik hasil penjumlahan..."
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />
                </div>
              </div>

              <label
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer ${subCardBg}`}
              >
                <input
                  type="checkbox"
                  checked={humanVerified}
                  onChange={(e) => setHumanVerified(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-xs font-bold">
                  Saya menyatakan laporan dan foto bukti ini asli, bukan iklan/spam, dan berada di Kabupaten Kudus.
                </span>
              </label>

              <button
                type="submit"
                disabled={!isSubmitUnlocked}
                className={`w-full py-3.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                  isSubmitUnlocked
                    ? 'bento-blue-3d text-white cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitUnlocked ? (
                  <>
                    <Send className="w-4 h-4" /> Kirim Laporan Terverifikasi
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Verifikasi GPS Wilayah Kudus untuk Mengirim
                  </>
                )}
              </button>
            </form>

            {/* Kolom Kanan: Keterangan Jangkauan GPS */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bento-dark-3d rounded-[28px] p-6 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Keterangan
                  </span>
                  <Info className="w-5 h-5 text-amber-300" />
                </div>

                {/* Keterangan Khusus Jangkauan GPS */}
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-300">
                      Keterangan Jangkauan GPS
                    </p>
                    <p className="text-[11px] text-white/90 mt-1 leading-relaxed">
                      Layanan GPS hanya mendeteksi area di sekitar{' '}
                      <strong>Kabupaten Kudus</strong>. Pastikan GPS perangkat aktif
                      dan Anda berada di wilayah Kudus agar formulir terbuka.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LACAK LAPORAN */}
        {menu === 'lacak' && (
          <div className={`rounded-[28px] border p-5 sm:p-6 space-y-5 ${cardBg}`}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'semua', label: 'Semua Publik' },
                    { id: 'ditugaskan', label: 'Ditugaskan' },
                    { id: 'penanganan', label: 'Diproses' },
                    { id: 'selesai', label: 'Selesai' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        statusFilter === f.id
                          ? 'bento-blue-3d text-white'
                          : `${subCardBg} ${mutedText}`
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setOnlyMyReports(!onlyMyReports);
                      setStatusFilter('semua');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                      onlyMyReports
                        ? 'bg-[#0f172a] text-white border-[#0f172a]'
                        : `${subCardBg} text-blue-600`
                    }`}
                  >
                    Laporan Saya
                  </button>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari tiket SF-2026..., judul, jalan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-full border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[11px] font-bold mr-1 ${mutedText}`}>
                    Prioritas:
                  </span>
                  {['semua', 'Tinggi', 'Sedang', 'Rendah'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition cursor-pointer ${
                        priorityFilter === p
                          ? p === 'Tinggi'
                            ? 'bg-red-600 text-white border-red-600'
                            : p === 'Sedang'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : p === 'Rendah'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-[#0f172a] text-white border-[#0f172a]'
                          : `${subCardBg} ${mutedText}`
                      }`}
                    >
                      {p === 'semua' ? 'Semua' : p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSortByPriority(!sortByPriority)}
                  className={`px-3.5 py-1.5 rounded-full border text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    sortByPriority
                      ? 'bg-blue-600/10 border-blue-600/30 text-blue-600'
                      : subCardBg
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortByPriority ? 'Urut: Prioritas Tertinggi' : 'Urut: Terbaru'}
                </button>
              </div>

              <p className={`text-[11px] ${mutedText}`}>
                * Laporan baru berstatus <strong>Menunggu Verifikasi</strong> hanya
                tampil di menu <strong>Laporan Saya</strong> atau pencarian nomor tiket
                persis hingga disetujui Admin.
              </p>
            </div>

            {filteredReports.length === 0 ? (
              <div className={`py-10 text-center text-xs ${mutedText}`}>
                Tidak ada laporan yang sesuai dengan filter saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredReports.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setDetailReport(item)}
                    className={`rounded-[24px] border p-4 flex flex-col justify-between gap-3 cursor-pointer ${subCardBg}`}
                  >
                    <div>
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-36 object-cover rounded-2xl mb-3"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-blue-600">
                          {item.id}
                        </span>
                        {renderPriorityBadge(item)}
                      </div>
                      <div className="mt-2">{renderStatusBadge(item.status)}</div>
                      <h3 className="text-sm font-extrabold mt-2">{item.title}</h3>
                      <p className={`text-xs mt-1 line-clamp-2 ${mutedText}`}>
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className={`truncate ${mutedText}`}>{item.location}</span>
                      <span className="text-blue-600 font-extrabold shrink-0">
                        Lihat →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL DETAIL LAPORAN */}
        {detailReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-[28px] border max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-blue-600">
                    {detailReport.id}
                  </span>
                  {renderPriorityBadge(detailReport)}
                </div>
                <button
                  onClick={() => setDetailReport(null)}
                  className={`p-1.5 rounded-full hover:bg-slate-500/10 cursor-pointer ${mutedText}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <img
                src={detailReport.image}
                alt={detailReport.title}
                className="w-full h-44 object-cover rounded-2xl"
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {renderStatusBadge(detailReport.status)}
                  <span className={`text-xs font-bold ${mutedText}`}>
                    • {detailReport.category}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold">{detailReport.title}</h3>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  {detailReport.description}
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${subCardBg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={mutedText}>Lokasi Kejadian</p>
                    <p className="font-bold mt-0.5">{detailReport.location}</p>
                  </div>
                  {detailReport.mapUrl && (
                    <a
                      href={detailReport.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <p className={mutedText}>Petugas Ditugaskan</p>
                  {Array.isArray(detailReport.assignedOfficers) &&
                  detailReport.assignedOfficers.length > 0 ? (
                    <ul className="mt-1 space-y-1 font-bold text-blue-600">
                      {detailReport.assignedOfficers.map((uname) => (
                        <li key={uname}>• {OFFICER_DIRECTORY[uname] || uname}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`italic mt-0.5 ${mutedText}`}>
                      Menunggu verifikasi Admin & penugasan tim lapangan
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleDownloadTicketJson(detailReport)}
                  className={`py-2.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${subCardBg}`}
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Tiket
                </button>
                <button
                  onClick={() => setDetailReport(null)}
                  className="py-2.5 rounded-full bento-blue-3d text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LOGIN GOOGLE */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-[28px] border max-w-md w-full p-6 space-y-4 shadow-2xl ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bento-blue-3d text-white font-extrabold text-xs flex items-center justify-center">
                    G
                  </div>
                  <h3 className="text-base font-extrabold">Masuk Akun Warga</h3>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className={`p-1.5 rounded-full hover:bg-slate-500/10 cursor-pointer ${mutedText}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGoogleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Maulana"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs ${subCardBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Alamat Gmail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs ${subCardBg}`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bento-blue-3d text-white text-xs font-extrabold cursor-pointer"
                >
                  Lanjutkan dengan Google
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING BOTTOM DOCK */}
      <nav
        aria-label="Navigasi Utama"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md rounded-full border p-1.5 flex items-center justify-between gap-1 z-40 backdrop-blur-xl shadow-2xl transition-colors ${
          darkMode
            ? 'bg-[#141b29]/95 border-slate-700/80 shadow-black/50'
            : 'bg-white/95 border-slate-200/90 shadow-slate-900/15'
        }`}
      >
        {navTabs.map((item) => {
          const Icon = item.icon;
          const active = menu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'lapor') {
                  openReportForm();
                } else {
                  setMenu(item.id);
                  if (item.id !== 'lacak') setOnlyMyReports(false);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bento-blue-3d text-white shadow-md'
                  : `${mutedText} hover:text-blue-600 hover:bg-blue-600/5`
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}