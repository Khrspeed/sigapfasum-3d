export const KUDUS_CATEGORIES = [
  {
    id: 'Jalan Rusak',
    label: 'Jalan & Jembatan',
    defaultPriority: 'Tinggi',
    sampleImage:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Taman Kota',
    label: 'Pohon Tumbang & Taman',
    defaultPriority: 'Tinggi',
    sampleImage:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Lampu PJU',
    label: 'Lampu Jalan (PJU)',
    defaultPriority: 'Sedang',
    sampleImage:
      'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Drainase',
    label: 'Saluran & Drainase',
    defaultPriority: 'Sedang',
    sampleImage:
      'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'Halte & Trotoar',
    label: 'Halte & Trotoar',
    defaultPriority: 'Rendah',
    sampleImage:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  },
];

// Titik pusat Kabupaten Kudus (Simpang Tujuh) & Geofence 9 Kecamatan
export const KUDUS_CENTER = {
  lat: -6.8048,
  lng: 110.8405,
};

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function validateKudusGeofence(lat, lng, accuracy = 0) {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return { allowed: false, reason: 'invalid_coords', distanceKm: null };
  }

  const distanceKm = calculateDistanceKm(
    lat,
    lng,
    KUDUS_CENTER.lat,
    KUDUS_CENTER.lng
  );

  const inBoundingBox =
    lat >= -6.97 && lat <= -6.62 && lng >= 110.72 && lng <= 111.0;
  const inRadius = distanceKm <= 23;

  if (!inBoundingBox || !inRadius) {
    return {
      allowed: false,
      reason: 'outside_kudus',
      distanceKm,
    };
  }

  if (accuracy > 1500) {
    return {
      allowed: false,
      reason: 'low_accuracy',
      distanceKm,
    };
  }

  return {
    allowed: true,
    reason: 'ok',
    distanceKm,
  };
}

// Sanitasi input teks untuk mencegah XSS & karakter berlebih
export function sanitizeText(input = '') {
  return String(input)
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Filter Anti-Iklan, Anti-Link, dan Kualitas Kalimat
export function validateReportContent(title = '', description = '', location = '') {
  const cleanTitle = sanitizeText(title);
  const cleanDesc = sanitizeText(description);
  const cleanLoc = sanitizeText(location);
  const combined = `${cleanTitle} ${cleanDesc} ${cleanLoc}`;

  // 1. Blokir tautan / domain / shortlink
  const urlPattern =
    /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|id|net|org|xyz|site|online|top|vip|club|info|biz|me|io|co|link|ly|gg)\b|wa\.me|t\.me|bit\.ly|tinyurl)/i;
  if (urlPattern.test(combined)) {
    return {
      valid: false,
      error:
        'Keamanan Konten: Laporan dilarang mengandung tautan (link) atau alamat situs web.',
    };
  }

  // 2. Blokir kata kunci iklan, judi online, pinjol, dan promosi
  const spamKeywordPattern =
    /\b(slot|gacor|maxwin|judol|judi|togel|casino|sbobet|zeus|scatter|jackpot|pinjol|dana\s*cepat|cair\s*cepat|bokep|vcs|open\s*bo|jual\s*followers|klik\s*link|daftar\s*sekarang|bonus\s*new\s*member)\b/i;
  if (spamKeywordPattern.test(combined)) {
    return {
      valid: false,
      error:
        'Keamanan Konten: Terdeteksi kata terlarang atau unsur promosi/iklan yang tidak berkaitan dengan fasilitas umum.',
    };
  }

  // 3. Blokir penyebaran nomor HP/WhatsApp di kolom laporan publik
  const phonePattern = /(\+62|628|08)[0-9\s-]{8,14}/;
  if (phonePattern.test(combined)) {
    return {
      valid: false,
      error:
        'Keamanan Konten: Jangan mencantumkan nomor telepon atau WhatsApp di dalam judul maupun deskripsi laporan.',
    };
  }

  // 4. Blokir spam karakter berulang (contoh: "aaaaaaa" atau "111111")
  if (/(.)\1{5,}/.test(combined)) {
    return {
      valid: false,
      error:
        'Keamanan Konten: Hindari pengulangan huruf atau angka yang tidak wajar.',
    };
  }

  // 5. Validasi panjang & jumlah kata minimal agar bukan isian asal-asalan
  const titleWords = cleanTitle.split(' ').filter(Boolean);
  if (cleanTitle.length < 8 || titleWords.length < 2) {
    return {
      valid: false,
      error:
        'Judul laporan terlalu singkat (minimal 8 karakter dan 2 kata yang jelas).',
    };
  }

  const descWords = cleanDesc.split(' ').filter(Boolean);
  if (cleanDesc.length < 20 || descWords.length < 4) {
    return {
      valid: false,
      error:
        'Detail kerusakan terlalu singkat (minimal 20 karakter dan 4 kata agar mudah dipahami petugas).',
    };
  }

  if (cleanLoc.length < 6) {
    return {
      valid: false,
      error: 'Detail alamat atau patokan lokasi belum lengkap.',
    };
  }

  return { valid: true };
}

export const OFFICER_DIRECTORY = {
  petugas1: 'Budi Santoso (Tim Jalan & Jembatan)',
  petugas2: 'Ahmad Fauzi (Tim PJU & Kelistrikan)',
  petugas3: 'Rina Wati (Tim Drainase & Sungai)',
  petugas4: 'Dimas Saputra (Tim Taman & Ruang Hijau)',
  petugas5: 'Eko Prasetyo (Tim Halte & Trotoar)',
};

export const PRIORITY_LEVELS = [
  {
    id: 'Tinggi',
    label: 'Tinggi',
    desc: 'Darurat / membahayakan',
    weight: 3,
    badgeClass: 'bg-red-500/15 text-red-600 border-red-500/30',
    activeBtnClass: 'bg-red-600 text-white border-red-600 shadow-md',
    dotClass: 'bg-red-500',
  },
  {
    id: 'Sedang',
    label: 'Sedang',
    desc: 'Perlu penanganan cepat',
    weight: 2,
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    activeBtnClass: 'bg-amber-500 text-white border-amber-500 shadow-md',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'Rendah',
    label: 'Rendah',
    desc: 'Kerusakan ringan',
    weight: 1,
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    activeBtnClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    dotClass: 'bg-emerald-500',
  },
];

export function detectAutoPriority(category = '', title = '') {
  const text = `${category} ${title}`.toLowerCase();
  if (
    text.includes('tumbang') ||
    text.includes('amblas') ||
    text.includes('berlubang') ||
    text.includes('listrik') ||
    text.includes('banjir') ||
    text.includes('jalan rusak')
  ) {
    return 'Tinggi';
  }
  if (text.includes('pju') || text.includes('lampu') || text.includes('drainase')) {
    return 'Sedang';
  }
  return 'Rendah';
}

export function getReportPriority(report) {
  if (report?.priority && ['Tinggi', 'Sedang', 'Rendah'].includes(report.priority)) {
    return report.priority;
  }
  return detectAutoPriority(report?.category, report?.title);
}

export function getPriorityMeta(priority) {
  return (
    PRIORITY_LEVELS.find((p) => p.id === priority) ||
    PRIORITY_LEVELS.find((p) => p.id === 'Sedang')
  );
}

export function sortReportsByPriority(list = []) {
  return [...list].sort((a, b) => {
    const wA = getPriorityMeta(getReportPriority(a)).weight;
    const wB = getPriorityMeta(getReportPriority(b)).weight;
    return wB - wA;
  });
}

export const INITIAL_CITIZEN_REPORTS = [
  {
    id: 'SF-2026-001',
    title: 'Jalan Berlubang Kawasan Simpang Tujuh',
    category: 'Jalan Rusak',
    priority: 'Tinggi',
    location: 'Jl. Simpang Tujuh, Kec. Kota Kudus',
    mapUrl: 'https://www.google.com/maps?q=-6.8048,110.8405',
    description:
      'Lubang sedalam 15 cm di lajur kiri membahayakan pengendara motor saat malam hari.',
    status: 'Dalam Penanganan',
    assignedOfficers: ['petugas1', 'petugas3'],
    reporter: 'Ahmad Maulana',
    reporterEmail: 'ahmad.maulana@gmail.com',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    image:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'SF-2026-002',
    title: 'Lampu Penerangan Jalan Mati Total',
    category: 'Lampu PJU',
    priority: 'Sedang',
    location: 'Jl. Jenderal Sudirman, Rendeng, Kudus',
    mapUrl: 'https://www.google.com/maps?q=-6.8095,110.8482',
    description:
      'Tiga tiang lampu PJU padam sejak 3 hari lalu membuat jalanan gelap gulita.',
    status: 'Menunggu Verifikasi',
    assignedOfficers: [],
    reporter: 'Siti Nurhaliza',
    reporterEmail: 'siti.nurhaliza@gmail.com',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    image:
      'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'SF-2026-003',
    title: 'Saluran Air Tersumbat Sampah & Endapan',
    category: 'Drainase',
    priority: 'Sedang',
    location: 'Jl. Sunan Muria, Barongan, Kudus',
    mapUrl: 'https://www.google.com/maps?q=-6.7985,110.8420',
    description:
      'Air meluap ke badan jalan setiap kali hujan deras turun lebih dari 30 menit.',
    status: 'Ditugaskan',
    assignedOfficers: ['petugas3'],
    reporter: 'Deni Pratama',
    reporterEmail: 'deni.pratama@gmail.com',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    image:
      'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'SF-2026-004',
    title: 'Trotoar Amblas Depan Taman Bojana',
    category: 'Halte & Trotoar',
    priority: 'Rendah',
    location: 'Jl. Pemuda, Kec. Kota Kudus',
    mapUrl: 'https://www.google.com/maps?q=-6.8062,110.8418',
    description:
      'Paving trotoar amblas sepanjang 3 meter dan berisiko membuat pejalan kaki tersandung.',
    status: 'Ditugaskan',
    assignedOfficers: ['petugas5'],
    reporter: 'Ayu Lestari',
    reporterEmail: 'ayu.lestari@gmail.com',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'SF-2026-005',
    title: 'Pohon Tumbang Menutup Sebagian Taman',
    category: 'Taman Kota',
    priority: 'Tinggi',
    location: 'Taman Krida Wisata, Wergu Wetan, Kudus',
    mapUrl: 'https://www.google.com/maps?q=-6.8150,110.8490',
    description:
      'Dahan pohon besar patah akibat angin kencang dan menghalangi jalur pejalan kaki.',
    status: 'Laporan Selesai',
    assignedOfficers: ['petugas4'],
    reporter: 'Hendra Wijaya',
    reporterEmail: 'hendra.wijaya@gmail.com',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    image:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  },
];