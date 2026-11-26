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
  Send,
  Download,
  X,
  Sparkles,
  Crosshair,
  RefreshCw,
} from 'lucide-react';
import {
  INITIAL_CITIZEN_REPORTS,
  KUDUS_CATEGORIES,
  KUDUS_LOCATIONS,
  OFFICER_DIRECTORY,
  PRIORITY_LEVELS,
  detectAutoPriority,
  getPriorityMeta,
  getReportPriority,
  sortReportsByPriority,
} from './data/adminMockData';

const STORAGE_REPORTS_KEY = 'sigapfasum_warga_reports_v3';
const STORAGE_USER_KEY = 'sigapfasum_warga_user_v3';

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

  // Form Buat Laporan
  const [formCategory, setFormCategory] = useState(KUDUS_CATEGORIES[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState(KUDUS_CATEGORIES[0].defaultPriority);
  const [isManualPriority, setIsManualPriority] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formCoords, setFormCoords] = useState(null); // { lat, lng, accuracy, source }
  const [gpsState, setGpsState] = useState('idle'); // 'idle' | 'scanning' | 'locked' | 'error'
  const [gpsStatusText, setGpsStatusText] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formReporterName, setFormReporterName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);
  const [formNotice, setFormNotice] = useState(null);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(0);

  // Modal Detail & Modal Login Google
  const [detailReport, setDetailReport] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const photoInputRef = useRef(null);
  const watchIdRef = useRef(null);
  const gpsTimerRef = useRef(null);
  const bestFixRef = useRef(null);

  const stopGpsWatch = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (gpsTimerRef.current) {
      clearTimeout(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopGpsWatch();
  }, []);

  useEffect(() => {
    if (citizenUser?.name && !formReporterName) {
      setFormReporterName(citizenUser.name);
    }
  }, [citizenUser, formReporterName]);

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

  // GPS Akurasi Tinggi: Ambil beberapa sampel & pilih radius error terkecil
  const handleAccurateGps = () => {
    setFormNotice(null);
    stopGpsWatch();

    if (!navigator.geolocation) {
      setGpsState('error');
      setGpsStatusText('Browser tidak mendukung GPS. Pilih titik lokasi di bawah.');
      return;
    }

    bestFixRef.current = null;
    setGpsState('scanning');
    setGpsStatusText('Mengunci sinyal satelit GPS akurasi tinggi...');

    const finalizeBestFix = async () => {
      stopGpsWatch();
      const fix = bestFixRef.current;
      if (!fix) return;

      setGpsState('locked');
      setGpsStatusText(`Terkunci dengan akurasi ±${fix.accuracy} meter`);

      const resolvedAddress = await resolveAddressFromCoords(fix.lat, fix.lng);
      if (resolvedAddress) {
        setFormLocation(resolvedAddress);
      } else if (!formLocation.trim()) {
        setFormLocation(`Titik GPS (${fix.lat}, ${fix.lng}), Kabupaten Kudus`);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 999);

        if (!bestFixRef.current || accuracy < bestFixRef.current.accuracy) {
          bestFixRef.current = { lat, lng, accuracy, source: 'gps' };
          setFormCoords({ lat, lng, accuracy, source: 'gps' });
          setGpsStatusText(
            `Mengkalibrasi sinyal... akurasi terbaik saat ini ±${accuracy} meter`
          );
        }

        if (accuracy <= 20) {
          finalizeBestFix();
        }
      },
      (err) => {
        stopGpsWatch();
        if (bestFixRef.current) {
          finalizeBestFix();
          return;
        }
        setGpsState('error');
        if (err.code === 1) {
          setGpsStatusText(
            'Izin lokasi ditolak browser. Aktifkan izin lokasi atau pilih titik lokasi di bawah.'
          );
        } else {
          setGpsStatusText(
            'Sinyal GPS lemah/timeout. Coba ulangi di area terbuka atau pilih titik lokasi di bawah.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    gpsTimerRef.current = setTimeout(() => {
      if (bestFixRef.current) {
        finalizeBestFix();
      }
    }, 5500);
  };

  const handleSelectPresetLocation = (locObj) => {
    stopGpsWatch();
    setFormLocation(locObj.name);
    setFormCoords({ lat: locObj.lat, lng: locObj.lng, accuracy: 15, source: 'preset' });
    setGpsState('locked');
    setGpsStatusText('Titik lokasi Kabupaten Kudus dipilih');
  };

  const navTabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'lapor', label: 'Buat Laporan', icon: PlusCircle },
    { id: 'lacak', label: 'Lacak Laporan', icon: Search },
  ];

  const stats = {
    total: reports.length,
    verifikasi: reports.filter((r) => r.status === 'Menunggu Verifikasi').length,
    penanganan: reports.filter(
      (r) => r.status === 'Dalam Penanganan' || r.status === 'Ditugaskan'
    ).length,
    selesai: reports.filter((r) => r.status === 'Laporan Selesai').length,
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormImage(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    setFormNotice(null);

    if (!formTitle.trim() || !formLocation.trim() || !formDescription.trim()) {
      setFormNotice({
        type: 'error',
        text: 'Judul kerusakan, lokasi kejadian, dan deskripsi wajib diisi.',
      });
      return;
    }

    if (!formCoords) {
      setFormNotice({
        type: 'error',
        text: 'Wajib mengunci lokasi GPS atau memilih titik lokasi Kabupaten Kudus.',
      });
      return;
    }

    if (!humanVerified) {
      setFormNotice({
        type: 'error',
        text: 'Centang konfirmasi laporan valid terlebih dahulu.',
      });
      return;
    }

    if (Date.now() - lastSubmittedAt < 10000) {
      setFormNotice({
        type: 'error',
        text: 'Mohon tunggu beberapa detik sebelum mengirim laporan berikutnya.',
      });
      return;
    }

    const catObj =
      KUDUS_CATEGORIES.find((c) => c.id === formCategory) || KUDUS_CATEGORIES[0];
    const ticketId = `SF-2026-${String(reports.length + 1).padStart(3, '0')}`;
    const reporterFinalName =
      (citizenUser?.name || formReporterName || 'Warga Kudus').trim();

    const newReport = {
      id: ticketId,
      title: formTitle.trim(),
      category: formCategory,
      priority: formPriority,
      location: formLocation.trim(),
      mapUrl: `https://www.google.com/maps?q=${formCoords.lat},${formCoords.lng}`,
      description: formDescription.trim(),
      status: 'Menunggu Verifikasi',
      assignedOfficers: [],
      reporter: reporterFinalName,
      reporterEmail: citizenUser?.email || '',
      createdAt: new Date().toISOString(),
      image: formImage || catObj.sampleImage,
    };

    setReports((prev) => [newReport, ...prev]);
    setLastSubmittedAt(Date.now());

    setFormTitle('');
    setFormDescription('');
    setFormImage('');
    setIsManualPriority(false);
    setHumanVerified(false);

    setFormNotice({
      type: 'success',
      text: `Laporan terkirim dengan Nomor Tiket ${ticketId} (Prioritas ${formPriority})!`,
    });
    setDetailReport(newReport);
  };

  const handleGoogleLoginSubmit = (e) => {
    e.preventDefault();
    const name = googleNameInput.trim() || 'Ahmad Maulana';
    const email =
      googleEmailInput.trim() ||
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

  const baseFilteredReports = reports.filter((r) => {
    const matchText =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());
    if (!matchText) return false;

    if (onlyMyReports && citizenUser) {
      const isMine =
        (r.reporterEmail && r.reporterEmail === citizenUser.email) ||
        r.reporter.toLowerCase() === citizenUser.name.toLowerCase();
      if (!isMine) return false;
    }

    if (priorityFilter !== 'semua' && getReportPriority(r) !== priorityFilter) {
      return false;
    }

    if (statusFilter === 'verifikasi') return r.status === 'Menunggu Verifikasi';
    if (statusFilter === 'penanganan') {
      return r.status === 'Dalam Penanganan' || r.status === 'Ditugaskan';
    }
    if (statusFilter === 'selesai') return r.status === 'Laporan Selesai';
    return true;
  });

  const filteredReports = sortByPriority
    ? sortReportsByPriority(baseFilteredReports)
    : baseFilteredReports;

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
    <div className={`min-h-screen transition-colors duration-300 pb-28 ${pageBg}`}>
      {/* TOP HEADER BERSIH (BRAND + TEMA + AKUN) */}
      <header className="sticky top-0 z-40 pt-4 px-4 sm:px-8">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setMenu('beranda')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bento-blue-3d text-white font-extrabold flex items-center justify-center text-sm">
              SF
            </div>
            <div className="text-left leading-tight">
              <span className="text-lg font-extrabold tracking-tight block">
                Sigap<span className="text-blue-600">Fasum</span>
              </span>
              <span className={`text-[10px] font-semibold block ${mutedText}`}>
                Kabupaten Kudus
              </span>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Ubah Tema Terang / Gelap"
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition cursor-pointer ${
                darkMode
                  ? 'bg-[#141b29] border-slate-800 text-amber-400'
                  : 'bg-white border-slate-200/80 text-slate-600 shadow-xs'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {citizenUser ? (
              <div
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border ${
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
                className="px-4 py-2.5 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
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
                    <MapPin className="w-3.5 h-3.5" /> Layanan Warga Kabupaten Kudus
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    {citizenUser
                      ? `Halo, ${citizenUser.name}! Ada Fasilitas Rusak di Sekitar Anda?`
                      : 'Laporkan Kerusakan Fasilitas Umum dengan Cepat & Akurat'}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                    Kirim foto bukti, titik GPS otomatis, dan tingkat prioritas penanganan agar tim lapangan segera menindaklanjuti.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-6 relative">
                  <button
                    onClick={() => setMenu('lapor')}
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
                    <Search className="w-4 h-4" /> Lacak Semua Laporan
                  </button>
                </div>
              </div>

              {/* Kartu Ringkasan Status 3D */}
              <div
                className={`lg:col-span-5 rounded-[28px] border p-6 flex flex-col justify-between gap-4 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold">Status Penanganan</h2>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Total {stats.total} pengaduan warga tercatat
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600/10 text-blue-600">
                    {completionPercent}% Tuntas
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setStatusFilter('verifikasi');
                      setMenu('lacak');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition hover:border-blue-500/50 cursor-pointer ${subCardBg}`}
                  >
                    <Clock className="w-4 h-4 text-blue-600 mb-2" />
                    <p className="text-2xl font-extrabold">{stats.verifikasi}</p>
                    <p className={`text-[11px] font-bold mt-0.5 ${mutedText}`}>
                      Verifikasi
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setStatusFilter('penanganan');
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

            {/* Daftar Laporan Terkini */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold">
                    Laporan Fasilitas Umum Terkini
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Diurutkan berdasarkan tingkat prioritas penanganan
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
                  Lihat Semua ({reports.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortReportsByPriority(reports)
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

        {/* VIEW 2: FORM BUAT LAPORAN + GPS AKURASI TINGGI */}
        {menu === 'lapor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={handleSubmitReport}
              className={`lg:col-span-8 rounded-[28px] border p-6 sm:p-7 space-y-5 ${cardBg}`}
            >
              <div>
                <h2 className="text-lg font-extrabold">
                  Buat Laporan Fasilitas Umum
                </h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Kunci lokasi GPS agar petugas menemukan titik kerusakan secara presisi.
                </p>
              </div>

              {formNotice && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold ${
                    formNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      : 'bg-red-500/10 border-red-500/30 text-red-500'
                  }`}
                >
                  {formNotice.text}
                </div>
              )}

              {/* 1. Kategori */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold">
                  1. Kategori Fasilitas
                </label>
                <div className="flex flex-wrap gap-2">
                  {KUDUS_CATEGORIES.map((cat) => {
                    const active = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
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

              {/* 2. Judul */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold">
                  2. Judul Laporan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jalan Berlubang Depan Pasar Kliwon Kudus"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                />
              </div>

              {/* 3. Tingkat Prioritas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold">
                    3. Tingkat Prioritas
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                    <Sparkles className="w-3 h-3" />
                    {isManualPriority ? 'Dipilih manual' : 'Otomatis'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
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
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isActive
                            ? lvl.activeBtnClass
                            : `${subCardBg} ${mutedText} hover:border-blue-500/50`
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-white' : lvl.dotClass
                            }`}
                          />
                          <span className="text-xs font-extrabold">{lvl.label}</span>
                        </div>
                        <p
                          className={`text-[10px] mt-1 ${
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

              {/* 4. GPS Akurasi Tinggi + Peta Pin */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold">
                    4. Lokasi Kejadian & Kunci GPS Akurat
                  </label>
                  <button
                    type="button"
                    onClick={handleAccurateGps}
                    disabled={gpsState === 'scanning'}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    {gpsState === 'scanning' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Mengunci Satelit GPS...
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3.5 h-3.5" />
                        {formCoords ? 'Kalibrasi Ulang GPS' : 'Deteksi Lokasi GPS Akurat'}
                      </>
                    )}
                  </button>
                </div>

                {gpsStatusText && (
                  <p
                    className={`text-[11px] font-bold ${
                      gpsState === 'error'
                        ? 'text-red-500'
                        : gpsState === 'scanning'
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {gpsStatusText}
                  </p>
                )}

                <input
                  type="text"
                  required
                  placeholder="Alamat otomatis terisi dari GPS atau ketik patokan lokasi..."
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                />

                {/* Pilihan Cepat Titik Kudus */}
                <div className="flex flex-wrap gap-1.5">
                  {KUDUS_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleSelectPresetLocation(loc)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                        formLocation === loc.name
                          ? 'bg-blue-600/15 border-blue-600 text-blue-600'
                          : `${subCardBg} ${mutedText}`
                      }`}
                    >
                      📍 {loc.name.split(',')[0]}
                    </button>
                  ))}
                </div>

                {/* Pratinjau Peta Pin & Koordinat */}
                {formCoords && (
                  <div className={`rounded-2xl border overflow-hidden ${subCardBg}`}>
                    <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600">
                          ✓ {formCoords.lat}, {formCoords.lng}
                        </span>
                        {formCoords.accuracy && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              formCoords.accuracy <= 35
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            Akurasi ±{formCoords.accuracy} m
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${formCoords.lat},${formCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-extrabold hover:underline inline-flex items-center gap-1"
                      >
                        Buka Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <iframe
                      title="Peta Lokasi GPS"
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

              {/* 5. Deskripsi & Foto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold">
                    5. Detail Kerusakan
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Jelaskan kondisi kerusakan secara singkat..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold">
                    6. Foto Bukti Lapangan
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className={`h-[104px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden ${subCardBg}`}
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
                          Unggah Foto Bukti
                        </span>
                        <span className={`text-[10px] ${mutedText}`}>
                          Opsional (otomatis foto kategori)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 7. Pelapor & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-extrabold mb-1">
                    Nama Pelapor
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Anda (atau masuk Google)"
                    value={citizenUser ? citizenUser.name : formReporterName}
                    disabled={Boolean(citizenUser)}
                    onChange={(e) => setFormReporterName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs ${subCardBg}`}
                  />
                </div>

                <label
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer mt-4 sm:mt-5 ${subCardBg}`}
                >
                  <input
                    type="checkbox"
                    checked={humanVerified}
                    onChange={(e) => setHumanVerified(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span className="text-xs font-bold">
                    Saya memastikan laporan ini valid
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Kirim Laporan Sekarang
              </button>
            </form>

            {/* Kolom Kanan: Panduan Singkat */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bento-dark-3d rounded-[28px] p-6 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300">
                    Tips Akurasi GPS & Prioritas
                  </span>
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/10">
                    <p className="font-extrabold text-blue-300">📍 Kunci Lokasi Presisi</p>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      Tekan tombol GPS saat berada di dekat lokasi kerusakan agar radius akurasi di bawah 25 meter.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10">
                    <p className="font-extrabold text-red-300">● Prioritas Tinggi</p>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      Pohon tumbang menutup jalan, jalan berlubang dalam, atau jembatan rusak.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/10">
                    <p className="font-extrabold text-amber-300">● Prioritas Sedang & Rendah</p>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      Lampu PJU mati, drainase tersumbat, atau trotoar rusak ringan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LACAK LAPORAN */}
        {menu === 'lacak' && (
          <div className={`rounded-[28px] border p-6 space-y-5 ${cardBg}`}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Filter Status + Laporan Saya */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'verifikasi', label: 'Verifikasi' },
                    { id: 'penanganan', label: 'Diproses' },
                    { id: 'selesai', label: 'Selesai' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        statusFilter === f.id
                          ? 'bento-blue-3d text-white'
                          : `${subCardBg} ${mutedText}`
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  {citizenUser && (
                    <button
                      onClick={() => setOnlyMyReports(!onlyMyReports)}
                      className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                        onlyMyReports
                          ? 'bg-[#0f172a] text-white border-[#0f172a]'
                          : `${subCardBg} text-blue-600`
                      }`}
                    >
                      Laporan Saya
                    </button>
                  )}
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

              {/* Filter Prioritas & Urutan */}
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
                      Menunggu penugasan tim lapangan
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

      {/* FLOATING BOTTOM DOCK (MENGAMBANG DI BAWAH UNTUK SEMUA LAYAR) */}
      <nav
        aria-label="Navigasi Utama"
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md rounded-full border p-1.5 flex items-center justify-between gap-1 z-40 backdrop-blur-xl shadow-2xl transition-colors ${
          darkMode
            ? 'bg-[#141b29]/90 border-slate-700/80 shadow-black/50'
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
                setMenu(item.id);
                if (item.id !== 'lacak') setOnlyMyReports(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                active
                  ? 'bento-blue-3d text-white shadow-md scale-[1.02]'
                  : `${mutedText} hover:text-blue-600 hover:bg-blue-600/5`
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}