import { useEffect, useRef, useState } from 'react';
import {
  Home,
  PlusCircle,
  Search,
  FileText,
  User,
  LogIn,
  LogOut,
  MapPin,
  ExternalLink,
  Bell,
  Moon,
  Sun,
  Clock,
  Wrench,
  CheckCircle2,
  Flag,
  ArrowUpDown,
  Camera,
  Navigation,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  Send,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_CITIZEN_REPORTS,
  KUDUS_CATEGORIES,
  KUDUS_LOCATIONS,
  MONTH_OPTIONS,
  OFFICER_DIRECTORY,
  PRIORITY_LEVELS,
  TIMEFRAME_OPTIONS,
  buildRealtimeStats,
  detectAutoPriority,
  getPriorityMeta,
  getReportPriority,
  setAnchorMonthYear,
  sortReportsByPriority,
  stepAnchorByTimeframe,
} from './data/adminMockData';

const STORAGE_REPORTS_KEY = 'sigapfasum_warga_reports_v2';
const STORAGE_USER_KEY = 'sigapfasum_warga_user_v2';

export default function App() {
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Abaikan jika storage kosong
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

  // Filter & Sorting Lacak Laporan
  const [statusFilter, setStatusFilter] = useState('semua');
  const [priorityFilter, setPriorityFilter] = useState('semua');
  const [sortByPriority, setSortByPriority] = useState(true);
  const [search, setSearch] = useState('');

  // Statistik Realtime + Navigasi Bulan & Tahun
  const [chartTimeframe, setChartTimeframe] = useState('today');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [customAnchorMs, setCustomAnchorMs] = useState(() => Date.now());

  // State Form Buat Laporan Warga
  const [formCategory, setFormCategory] = useState(KUDUS_CATEGORIES[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState(KUDUS_CATEGORIES[0].defaultPriority);
  const [isManualPriority, setIsManualPriority] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formCoords, setFormCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [formReporterName, setFormReporterName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);
  const [formNotice, setFormNotice] = useState(null);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(0);

  // Modal Detail Laporan & Modal Login Google
  const [detailReport, setDetailReport] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const photoInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (citizenUser?.name && !formReporterName) {
      setFormReporterName(citizenUser.name);
    }
  }, [citizenUser, formReporterName]);

  const activeAnchorMs = isLiveMode ? nowTick : customAnchorMs;
  const anchorDateObj = new Date(activeAnchorMs);
  const selectedMonth = anchorDateObj.getMonth();
  const selectedYear = anchorDateObj.getFullYear();

  const baseCurrentYear = new Date(nowTick).getFullYear();
  const yearOptions = Array.from(
    new Set([
      baseCurrentYear - 2,
      baseCurrentYear - 1,
      baseCurrentYear,
      baseCurrentYear + 1,
      baseCurrentYear + 2,
      selectedYear - 1,
      selectedYear,
      selectedYear + 1,
    ])
  ).sort((a, b) => a - b);

  const handleChangeMonth = (newMonth) => {
    setCustomAnchorMs(setAnchorMonthYear(activeAnchorMs, selectedYear, Number(newMonth)));
    setIsLiveMode(false);
  };

  const handleChangeYear = (newYear) => {
    setCustomAnchorMs(setAnchorMonthYear(activeAnchorMs, Number(newYear), selectedMonth));
    setIsLiveMode(false);
  };

  const handleStepPeriod = (direction) => {
    setCustomAnchorMs(stepAnchorByTimeframe(activeAnchorMs, chartTimeframe, direction));
    setIsLiveMode(false);
  };

  const handleResetToLive = () => {
    const now = Date.now();
    setNowTick(now);
    setCustomAnchorMs(now);
    setIsLiveMode(true);
  };

  const realtimeStats = buildRealtimeStats(reports, chartTimeframe, activeAnchorMs);
  const liveClockLabel = new Date(nowTick).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const topTabs = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'lapor', label: 'Buat Laporan' },
    { id: 'lacak', label: 'Lacak Laporan' },
    { id: 'laporan-saya', label: 'Laporan Saya' },
  ];

  const dockItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'lapor', label: 'Buat Laporan', icon: PlusCircle },
    { id: 'lacak', label: 'Lacak Laporan', icon: Search },
    { id: 'laporan-saya', label: 'Laporan Saya', icon: FileText },
  ];

  const stats = {
    total: reports.length,
    verifikasi: reports.filter((r) => r.status === 'Menunggu Verifikasi').length,
    penanganan: reports.filter(
      (r) => r.status === 'Dalam Penanganan' || r.status === 'Ditugaskan'
    ).length,
    selesai: reports.filter((r) => r.status === 'Laporan Selesai').length,
    prioritasTinggi: reports.filter(
      (r) => getReportPriority(r) === 'Tinggi' && r.status !== 'Laporan Selesai'
    ).length,
  };

  const completionPercent =
    stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;

  const myReports = citizenUser
    ? reports.filter(
        (r) =>
          (r.reporterEmail && r.reporterEmail === citizenUser.email) ||
          r.reporter.toLowerCase() === citizenUser.name.toLowerCase()
      )
    : [];

  // Auto-deteksi prioritas saat kategori atau judul berubah
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

  const handleCaptureGps = () => {
    setFormNotice(null);
    if (!navigator.geolocation) {
      const fallback = KUDUS_LOCATIONS[0];
      setFormCoords({ lat: fallback.lat, lng: fallback.lng });
      if (!formLocation) setFormLocation(fallback.name);
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormCoords({ lat, lng });
        if (!formLocation.trim()) {
          setFormLocation(`Koordinat GPS (${lat}, ${lng}), Kabupaten Kudus`);
        }
        setGpsLoading(false);
      },
      () => {
        const fallback = KUDUS_LOCATIONS[0];
        setFormCoords({ lat: fallback.lat, lng: fallback.lng });
        if (!formLocation.trim()) {
          setFormLocation(fallback.name);
        }
        setGpsLoading(false);
        setFormNotice({
          type: 'info',
          text: 'GPS browser diblokir, titik lokasi otomatis diarahkan ke pusat Kabupaten Kudus (dapat disesuaikan).',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectPresetLocation = (locObj) => {
    setFormLocation(locObj.name);
    setFormCoords({ lat: locObj.lat, lng: locObj.lng });
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
        text: 'Wajib menyertakan titik koordinat GPS atau memilih titik lokasi Kabupaten Kudus.',
      });
      return;
    }

    if (!humanVerified) {
      setFormNotice({
        type: 'error',
        text: 'Centang verifikasi keamanan anti-spam terlebih dahulu.',
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
    const nextTicketNum = String(reports.length + 1).padStart(3, '0');
    const ticketId = `SF-2026-${nextTicketNum}`;
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
    setNowTick(Date.now());

    setFormTitle('');
    setFormDescription('');
    setFormImage('');
    setIsManualPriority(false);
    setHumanVerified(false);

    setFormNotice({
      type: 'success',
      text: `Laporan berhasil dikirim dengan Nomor Tiket ${ticketId} (Prioritas ${formPriority})!`,
    });
    setDetailReport(newReport);
  };

  const handleGoogleLoginSubmit = (e) => {
    e.preventDefault();
    const name = googleNameInput.trim() || 'Rasyad Habibie';
    const email =
      googleEmailInput.trim() ||
      `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const account = {
      name,
      email,
      provider: 'Google',
    };
    setCitizenUser(account);
    setFormReporterName(name);
    setIsLoginModalOpen(false);
  };

  const handleQuickGoogleDemo = (name, email) => {
    const account = { name, email, provider: 'Google' };
    setCitizenUser(account);
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
        Prioritas {meta.label}
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
    if (status === 'Ditolak') {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-500">
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
    <div className={`min-h-screen transition-colors duration-300 pb-24 md:pb-10 ${pageBg}`}>
      {/* TOP FLOATING PILL NAVBAR */}
      <header className="sticky top-0 z-40 pt-4 px-4 sm:px-8">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setMenu('beranda')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bento-blue-3d text-white font-extrabold flex items-center justify-center text-sm">
              SF
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Sigap<span className="text-blue-600">Fasum</span>
            </span>
          </button>

          {/* Center Capsule Tabs */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border shadow-sm backdrop-blur-md ${
              darkMode
                ? 'bg-[#141b29]/90 border-slate-800'
                : 'bg-white/95 border-slate-200/80'
            }`}
          >
            {topTabs.map((t) => {
              const active = menu === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMenu(t.id)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? darkMode
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#0f172a] text-white shadow-md'
                      : `${mutedText} hover:text-blue-600`
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setMenu('lacak');
                setPriorityFilter('Tinggi');
              }}
              title="Laporan Prioritas Tinggi"
              className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition cursor-pointer ${
                darkMode
                  ? 'bg-[#141b29] border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-600 shadow-xs'
              }`}
            >
              <Bell className="w-4 h-4" />
              {stats.prioritasTinggi > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

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
                className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border ${
                  darkMode
                    ? 'bg-[#141b29] border-slate-800'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="w-7 h-7 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center justify-center">
                  {citizenUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-extrabold">{citizenUser.name}</p>
                  <p className={`text-[10px] ${mutedText}`}>{citizenUser.email}</p>
                </div>
                <button
                  onClick={() => setCitizenUser(null)}
                  title="Keluar Akun Google"
                  className="ml-1 p-1 rounded-full text-slate-400 hover:text-red-500 transition cursor-pointer"
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

      {/* BODY WRAPPER WITH LEFT FLOATING ICON DOCK */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-6 flex gap-6 items-start">
        <aside
          className={`hidden lg:flex flex-col items-center justify-between py-4 px-2.5 rounded-[28px] border sticky top-24 min-h-[430px] shrink-0 ${
            darkMode
              ? 'bg-[#141b29] border-slate-800'
              : 'bg-white border-slate-200/80 bento-3d'
          }`}
        >
          <div className="flex flex-col gap-3">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const active = menu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMenu(item.id)}
                  title={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    active
                      ? 'bento-blue-3d text-white scale-105'
                      : `${mutedText} hover:bg-blue-600/10 hover:text-blue-600`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              citizenUser ? setCitizenUser(null) : setIsLoginModalOpen(true)
            }
            title={citizenUser ? 'Keluar Akun' : 'Login Warga'}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-blue-600/10 hover:text-blue-600 transition cursor-pointer"
          >
            {citizenUser ? (
              <LogOut className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>
        </aside>

        {/* MAIN BENTO CONTENT */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Header Sapaan Warga */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {citizenUser
                  ? `Halo, ${citizenUser.name}`
                  : 'Portal Pengaduan Fasilitas Umum'}
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${mutedText}`}>
                Laporkan kerusakan jalan, lampu PJU, drainase, atau pohon tumbang di Kabupaten Kudus.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {stats.prioritasTinggi > 0 && (
                <button
                  onClick={() => {
                    setMenu('lacak');
                    setStatusFilter('semua');
                    setPriorityFilter('Tinggi');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> {stats.prioritasTinggi} Prioritas Tinggi
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600/10 text-blue-600">
                <MapPin className="w-3.5 h-3.5" /> Kabupaten Kudus
              </span>
            </div>
          </div>

          {/* VIEW 1: BERANDA (3D BENTO OVERVIEW) */}
          {menu === 'beranda' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Kolom Kiri: Kartu Hero Aksi Cepat Warga */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div
                    className={`rounded-[28px] border p-6 flex-1 flex flex-col justify-between ${cardBg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${mutedText}`}>
                          Layanan Publik Kudus
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500">
                          Siaga 24 Jam
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2.5 mt-3">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {stats.total}
                        </span>
                        <span className={`text-xs font-semibold ${mutedText}`}>
                          Laporan Warga
                        </span>
                      </div>
                      <p className={`text-xs mt-2 leading-relaxed ${mutedText}`}>
                        Sertakan foto & lokasi GPS agar petugas lapangan segera menangani sesuai tingkat prioritas.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mt-6">
                      <button
                        onClick={() => setMenu('lapor')}
                        className="py-3 px-4 rounded-full bento-blue-3d text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Lapor Baru
                      </button>
                      <button
                        onClick={() => setMenu('lacak')}
                        className={`py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${subCardBg}`}
                      >
                        <Search className="w-3.5 h-3.5" /> Lacak Tiket
                      </button>
                    </div>
                  </div>

                  {/* Progress Penanganan Pemerintah Kudus */}
                  <div className={`rounded-[28px] border p-6 space-y-3 ${cardBg}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">
                        Tingkat Penyelesaian
                      </span>
                      <span className="text-xs font-extrabold text-blue-600">
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bento-blue-3d transition-all duration-500"
                        style={{ width: `${Math.max(completionPercent, 12)}%` }}
                      />
                    </div>
                    <div
                      className={`flex justify-between text-[11px] font-semibold ${mutedText}`}
                    >
                      <span>{stats.selesai} Fasilitas Tuntas</span>
                      <span>Dari {stats.total} Laporan</span>
                    </div>
                  </div>
                </div>

                {/* Kolom Tengah: Grid 2x2 Bento */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setMenu('lapor')}
                    className="bento-blue-3d rounded-[28px] p-5 text-white flex flex-col justify-between cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15 blur-md" />
                    <div className="flex items-center justify-between relative">
                      <span className="text-xs font-bold text-white/90">
                        Kirim Aduan
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <PlusCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="mt-6 relative">
                      <p className="text-2xl font-extrabold">+ Lapor</p>
                      <p className="text-[11px] text-blue-100 mt-1 font-medium">
                        GPS & Prioritas Otomatis
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setMenu('lacak');
                      setStatusFilter('verifikasi');
                    }}
                    className={`rounded-[28px] border p-5 flex flex-col justify-between cursor-pointer ${cardBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${mutedText}`}>
                        Verifikasi
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-3xl font-extrabold">
                        {stats.verifikasi}
                      </p>
                      <p className="text-[11px] text-blue-600 mt-1 font-bold">
                        Menunggu cek dinas
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setMenu('lacak');
                      setStatusFilter('penanganan');
                    }}
                    className={`rounded-[28px] border p-5 flex flex-col justify-between cursor-pointer ${cardBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${mutedText}`}>
                        Ditangani
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-3xl font-extrabold">
                        {stats.penanganan}
                      </p>
                      <p className="text-[11px] text-amber-500 mt-1 font-bold">
                        Petugas di lapangan
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setMenu('lacak');
                      setStatusFilter('selesai');
                    }}
                    className={`rounded-[28px] border p-5 flex flex-col justify-between cursor-pointer ${cardBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${mutedText}`}>
                        Selesai
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-3xl font-extrabold">{stats.selesai}</p>
                      <p className="text-[11px] text-emerald-500 mt-1 font-bold">
                        Sudah diperbaiki
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Grafik Statistik Realtime + Navigasi Bulan & Tahun */}
                <div
                  className={`lg:col-span-4 rounded-[28px] border p-5 sm:p-6 flex flex-col justify-between ${cardBg}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold">
                          Statistik Penanganan
                        </h3>
                        <p className={`text-[11px] mt-0.5 ${mutedText}`}>
                          {realtimeStats.periodSummary}
                        </p>
                      </div>

                      {isLiveMode ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live {liveClockLabel.slice(0, 5)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResetToLive}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                        >
                          <Radio className="w-3 h-3" /> Ke Live
                        </button>
                      )}
                    </div>

                    {/* Bar Navigasi Bulan & Tahun */}
                    <div
                      className={`flex items-center justify-between gap-1.5 p-1 rounded-full border ${subCardBg}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleStepPeriod(-1)}
                        title="Periode / Bulan / Tahun Sebelumnya"
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-blue-600/10 hover:text-blue-600 transition cursor-pointer shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <select
                          aria-label="Pilih Bulan"
                          value={selectedMonth}
                          onChange={(e) => handleChangeMonth(e.target.value)}
                          className={`text-[11px] font-extrabold bg-transparent focus:outline-none cursor-pointer px-1.5 py-0.5 rounded-lg ${
                            darkMode
                              ? 'text-slate-100 [&>option]:bg-[#141b29]'
                              : 'text-slate-800'
                          }`}
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.full}
                            </option>
                          ))}
                        </select>

                        <span className={`text-[10px] ${mutedText}`}>•</span>

                        <select
                          aria-label="Pilih Tahun"
                          value={selectedYear}
                          onChange={(e) => handleChangeYear(e.target.value)}
                          className={`text-[11px] font-extrabold bg-transparent focus:outline-none cursor-pointer px-1.5 py-0.5 rounded-lg ${
                            darkMode
                              ? 'text-blue-400 [&>option]:bg-[#141b29]'
                              : 'text-blue-600'
                          }`}
                        >
                          {yearOptions.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStepPeriod(1)}
                        title="Periode / Bulan / Tahun Berikutnya"
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-blue-600/10 hover:text-blue-600 transition cursor-pointer shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 5 Pilihan Rentang Waktu */}
                    <div
                      className={`flex flex-wrap gap-1 p-1 rounded-2xl border ${subCardBg}`}
                    >
                      {TIMEFRAME_OPTIONS.map((opt) => {
                        const active = chartTimeframe === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setChartTimeframe(opt.id)}
                            className={`flex-1 basis-[30%] py-1 px-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                              active
                                ? 'bento-blue-3d text-white shadow-xs'
                                : `${mutedText} hover:text-blue-600`
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold pt-0.5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          Masuk ({realtimeStats.totalMasuk})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              darkMode ? 'bg-slate-400' : 'bg-slate-800'
                            }`}
                          />
                          Selesai ({realtimeStats.totalSelesai})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batang Grafik Dinamis */}
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${realtimeStats.items.length}, minmax(0, 1fr))`,
                    }}
                    className="grid gap-1.5 items-end h-36 pt-4"
                  >
                    {realtimeStats.items.map((item) => {
                      const isCompact = realtimeStats.items.length > 7;
                      return (
                        <div
                          key={item.fullLabel}
                          className="flex flex-col items-center gap-1 h-full justify-end group"
                          title={`${item.fullLabel} • Masuk: ${item.masuk}, Selesai: ${item.selesai}`}
                        >
                          <span className="text-[8px] sm:text-[9px] font-extrabold text-blue-600 opacity-80 group-hover:opacity-100">
                            {item.masuk}/{item.selesai}
                          </span>
                          <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-20">
                            <div
                              style={{ height: `${item.masukHeight}%` }}
                              className={`${
                                isCompact ? 'w-1.5' : 'w-2.5'
                              } rounded-full transition-all duration-500 group-hover:scale-y-105 ${
                                item.masuk > 0
                                  ? 'bento-blue-3d'
                                  : 'bg-blue-600/20'
                              }`}
                            />
                            <div
                              style={{ height: `${item.selesaiHeight}%` }}
                              className={`${
                                isCompact ? 'w-1.5' : 'w-2.5'
                              } rounded-full transition-all duration-500 ${
                                item.selesai > 0
                                  ? darkMode
                                    ? 'bg-slate-400'
                                    : 'bg-[#0f172a]'
                                  : darkMode
                                  ? 'bg-slate-700/60'
                                  : 'bg-slate-300/60'
                              }`}
                            />
                          </div>
                          <span
                            className={`${
                              isCompact ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
                            } font-bold truncate max-w-full ${mutedText}`}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Laporan Terkini Kabupaten Kudus (Urut Prioritas) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold">
                      Laporan Fasilitas Umum Terkini
                    </h2>
                    <p className={`text-xs ${mutedText}`}>
                      Diurutkan otomatis berdasarkan tingkat prioritas (Tinggi → Sedang → Rendah).
                    </p>
                  </div>
                  <button
                    onClick={() => setMenu('lacak')}
                    className="px-4 py-2 rounded-full bg-[#0f172a] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto"
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
                        className={`rounded-[28px] border p-5 flex flex-col justify-between gap-3 cursor-pointer ${cardBg}`}
                      >
                        <div>
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-40 object-cover rounded-2xl mb-3.5"
                          />
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-blue-600">
                              {item.id}
                            </span>
                            {renderPriorityBadge(item)}
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {renderStatusBadge(item.status)}
                            <span className={`text-[11px] font-semibold ${mutedText}`}>
                              • {item.category}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold mt-2">
                            {item.title}
                          </h3>
                          <p className={`text-xs mt-1 line-clamp-2 ${mutedText}`}>
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <span
                            className={`flex items-center gap-1 truncate ${mutedText}`}
                          >
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

          {/* VIEW 2: FORM BUAT LAPORAN WARGA */}
          {menu === 'lapor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <form
                onSubmit={handleSubmitReport}
                className={`lg:col-span-8 rounded-[28px] border p-6 sm:p-7 space-y-5 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold">
                      Formulir Pengaduan Kerusakan
                    </h2>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Lengkapi data laporan dengan lokasi GPS dan tingkat prioritas yang sesuai.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-[11px] font-extrabold">
                    Tiket Otomatis
                  </span>
                </div>

                {formNotice && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-bold ${
                      formNotice.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : formNotice.type === 'info'
                        ? 'bg-blue-600/10 border-blue-600/30 text-blue-600'
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}
                  >
                    {formNotice.text}
                  </div>
                )}

                {/* 1. Kategori Fasilitas */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold">
                    1. Kategori Fasilitas Umum
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

                {/* 2. Judul Laporan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold">
                    2. Judul Laporan Singkat
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pohon Tumbang Menutup Jalan Raya Kudus - Jepara"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />
                </div>

                {/* 3. Tingkat Prioritas Laporan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-extrabold">
                      3. Tingkat Prioritas Laporan
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                      <Sparkles className="w-3 h-3" />
                      {isManualPriority
                        ? 'Dipilih manual oleh pelapor'
                        : 'Terdeteksi otomatis dari jenis laporan'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                              className={`w-2.5 h-2.5 rounded-full ${
                                isActive ? 'bg-white' : lvl.dotClass
                              }`}
                            />
                            <span className="text-xs font-extrabold">
                              {lvl.label}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] mt-1 ${
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

                {/* 4. Lokasi Kejadian & Validasi GPS */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-extrabold">
                      4. Lokasi Kejadian & Koordinat GPS (Wajib)
                    </label>
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={gpsLoading}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer self-start"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {gpsLoading ? 'Mendeteksi GPS...' : 'Ambil Lokasi GPS Saya'}
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Sunan Muria No. 12, Barongan, Kudus"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                  />

                  {/* Pilihan Cepat Titik Kudus */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
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

                  {formCoords && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-emerald-600">
                        ✓ GPS Terkunci: {formCoords.lat}, {formCoords.lng}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${formCoords.lat},${formCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-extrabold hover:underline inline-flex items-center gap-1"
                      >
                        Cek Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 5. Deskripsi & Foto Bukti */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold">
                      5. Detail Kondisi Kerusakan
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Jelaskan kondisi kerusakan secara singkat dan jelas..."
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
                      className={`h-[104px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden relative ${subCardBg}`}
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
                            Klik untuk unggah foto bukti
                          </span>
                          <span className={`text-[10px] ${mutedText}`}>
                            (Opsional, otomatis pakai foto kategori)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Identitas Pelapor & Anti-Spam */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
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
                      Saya memastikan laporan ini valid & bukan spam
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

              {/* Kolom Kanan: Panduan Prioritas & Keamanan */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bento-dark-3d rounded-[28px] p-6 text-white space-y-4 relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-blue-600/30 blur-xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-wider uppercase text-blue-300">
                      PANDUAN PRIORITAS
                    </span>
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/10">
                      <p className="font-extrabold text-red-300">
                        ● Prioritas Tinggi
                      </p>
                      <p className="text-[11px] text-white/80 mt-0.5">
                        Pohon tumbang menutup jalan, jalan berlubang dalam, jembatan rusak, atau kabel listrik membahayakan.
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10">
                      <p className="font-extrabold text-amber-300">
                        ● Prioritas Sedang
                      </p>
                      <p className="text-[11px] text-white/80 mt-0.5">
                        Lampu penerangan jalan (PJU) mati, saluran air/drainase tersumbat.
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10">
                      <p className="font-extrabold text-emerald-300">
                        ● Prioritas Rendah
                      </p>
                      <p className="text-[11px] text-white/80 mt-0.5">
                        Kerusakan ringan pada trotoar, halte, rambu pudar, atau penataan taman.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: LACAK SEMUA LAPORAN */}
          {menu === 'lacak' && (
            <div className={`rounded-[28px] border p-6 space-y-5 ${cardBg}`}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Filter Status */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'semua', label: 'Semua Status' },
                      { id: 'verifikasi', label: 'Verifikasi' },
                      { id: 'penanganan', label: 'Penanganan' },
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
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari tiket SF-2026..., judul, lokasi..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-full border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${subCardBg}`}
                    />
                  </div>
                </div>

                {/* Filter Tingkat Prioritas & Urutan */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-bold mr-1 ${mutedText}`}>
                      Prioritas:
                    </span>
                    {[
                      { id: 'semua', label: 'Semua' },
                      { id: 'Tinggi', label: 'Tinggi' },
                      { id: 'Sedang', label: 'Sedang' },
                      { id: 'Rendah', label: 'Rendah' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPriorityFilter(p.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition cursor-pointer ${
                          priorityFilter === p.id
                            ? p.id === 'Tinggi'
                              ? 'bg-red-600 text-white border-red-600'
                              : p.id === 'Sedang'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : p.id === 'Rendah'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-[#0f172a] text-white border-[#0f172a]'
                            : `${subCardBg} ${mutedText}`
                        }`}
                      >
                        {p.label}
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
                    {sortByPriority
                      ? 'Urutan: Prioritas Tertinggi'
                      : 'Urutan: Terbaru'}
                  </button>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className={`py-10 text-center text-xs ${mutedText}`}>
                  Tidak ditemukan laporan yang sesuai dengan filter pencarian.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredReports.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setDetailReport(item)}
                      className={`rounded-[24px] border p-5 flex flex-col justify-between gap-3 cursor-pointer ${subCardBg}`}
                    >
                      <div>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-36 object-cover rounded-2xl mb-3"
                        />
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-blue-600">
                            {item.id}
                          </span>
                          {renderPriorityBadge(item)}
                        </div>
                        <div className="mt-2">
                          {renderStatusBadge(item.status)}
                        </div>
                        <h3 className="text-sm font-extrabold mt-2">
                          {item.title}
                        </h3>
                        <p className={`text-xs mt-1 line-clamp-2 ${mutedText}`}>
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        <span className={`truncate ${mutedText}`}>
                          {item.location}
                        </span>
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

          {/* VIEW 4: LAPORAN SAYA (AKUN GOOGLE WARGA) */}
          {menu === 'laporan-saya' && (
            <div className="space-y-5">
              {!citizenUser ? (
                <div
                  className={`rounded-[28px] border p-8 text-center space-y-4 max-w-lg mx-auto ${cardBg}`}
                >
                  <div className="w-12 h-12 rounded-2xl bento-blue-3d text-white flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-extrabold">
                    Masuk untuk Melihat Riwayat Laporan Anda
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Hubungkan akun Google Anda untuk menyimpan riwayat pengaduan dan mengunduh bukti tiket laporan.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-6 py-3 rounded-full bento-blue-3d text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Masuk dengan Google
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bento-blue-3d rounded-[28px] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold">
                        Akun Warga Terverifikasi
                      </span>
                      <h2 className="text-2xl font-extrabold mt-2">
                        {citizenUser.name}
                      </h2>
                      <p className="text-xs text-blue-100">
                        {citizenUser.email} • {myReports.length} Laporan Terkirim
                      </p>
                    </div>
                    <button
                      onClick={() => setMenu('lapor')}
                      className="px-5 py-3 rounded-full bg-white text-blue-700 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-lg cursor-pointer self-start sm:self-center"
                    >
                      <PlusCircle className="w-4 h-4" /> Buat Laporan Baru
                    </button>
                  </div>

                  {myReports.length === 0 ? (
                    <div
                      className={`rounded-[28px] border p-8 text-center text-xs ${cardBg} ${mutedText}`}
                    >
                      Anda belum mengirim pengaduan menggunakan akun ini. Klik{' '}
                      <strong>Buat Laporan Baru</strong> untuk mulai melapor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {sortReportsByPriority(myReports).map((rep) => (
                        <div
                          key={rep.id}
                          onClick={() => setDetailReport(rep)}
                          className={`rounded-[28px] border p-5 space-y-3 cursor-pointer ${cardBg}`}
                        >
                          <img
                            src={rep.image}
                            alt={rep.title}
                            className="w-full h-36 object-cover rounded-2xl"
                          />
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-blue-600">
                              {rep.id}
                            </span>
                            {renderPriorityBadge(rep)}
                          </div>
                          <div>{renderStatusBadge(rep.status)}</div>
                          <h3 className="text-base font-extrabold">
                            {rep.title}
                          </h3>
                          <p className={`text-xs ${mutedText}`}>{rep.location}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODAL DETAIL LAPORAN & TIMELINE PROGRES */}
          {detailReport && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div
                className={`rounded-[28px] border max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderStatusBadge(detailReport.status)}
                    <span className={`text-xs font-bold ${mutedText}`}>
                      • {detailReport.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold">
                    {detailReport.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>
                    {detailReport.description}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${subCardBg}`}>
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
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p className={mutedText}>Petugas Lapangan Ditugaskan</p>
                    {Array.isArray(detailReport.assignedOfficers) &&
                    detailReport.assignedOfficers.length > 0 ? (
                      <ul className="mt-1 space-y-1 font-bold text-blue-600">
                        {detailReport.assignedOfficers.map((uname) => (
                          <li key={uname}>
                            • {OFFICER_DIRECTORY[uname] || uname}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`italic mt-0.5 ${mutedText}`}>
                        Menunggu penugasan tim oleh Admin Dinas Kudus
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleDownloadTicketJson(detailReport)}
                    className={`py-2.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${subCardBg}`}
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Bukti Tiket
                  </button>
                  <button
                    onClick={() => setDetailReport(null)}
                    className="py-2.5 rounded-full bento-blue-3d text-white text-xs font-bold cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL LOGIN GOOGLE WARGA */}
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
                    <h3 className="text-base font-extrabold">
                      Masuk Akun Warga Kudus
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsLoginModalOpen(false)}
                    className={`p-1.5 rounded-full hover:bg-slate-500/10 cursor-pointer ${mutedText}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className={`text-xs ${mutedText}`}>
                  Masuk menggunakan akun Google untuk memantau seluruh aduan fasilitas umum yang pernah Anda kirim.
                </p>

                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold text-blue-600">
                    1-Klik Akun Demo Cepat:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickGoogleDemo(
                          'Ahmad Maulana',
                          'ahmad.maulana@gmail.com'
                        )
                      }
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between hover:border-blue-600 transition cursor-pointer ${subCardBg}`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">Ahmad Maulana</p>
                        <p className={`text-[11px] ${mutedText}`}>
                          ahmad.maulana@gmail.com
                        </p>
                      </div>
                      <span className="text-[11px] font-extrabold text-blue-600">
                        Pilih →
                      </span>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleGoogleLoginSubmit}
                  className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800"
                >
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama Anda"
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
      </div>

      {/* FLOATING BOTTOM DOCK (MOBILE) */}
      <nav
        className={`md:hidden fixed bottom-4 left-4 right-4 rounded-full border shadow-xl px-2 py-2 flex items-center justify-around z-40 backdrop-blur-md ${
          darkMode
            ? 'bg-[#141b29]/95 border-slate-800'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const active = menu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMenu(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition ${
                active ? 'bento-blue-3d text-white' : mutedText
              }`}
            >
              <Icon className="w-4 h-4" />
              {active && <span>{item.label.split(' ')[0]}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}