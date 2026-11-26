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

export const KUDUS_LOCATIONS = [
  {
    name: 'Jl. Simpang Tujuh, Kec. Kota Kudus',
    lat: -6.8048,
    lng: 110.8405,
  },
  {
    name: 'Jl. Jenderal Sudirman, Rendeng, Kudus',
    lat: -6.8095,
    lng: 110.8482,
  },
  {
    name: 'Jl. Sunan Muria, Barongan, Kudus',
    lat: -6.7985,
    lng: 110.842,
  },
  {
    name: 'Taman Krida Wisata, Wergu Wetan, Kudus',
    lat: -6.815,
    lng: 110.849,
  },
  {
    name: 'Jl. Kudus - Jepara, Kaliwungu, Kudus',
    lat: -6.7921,
    lng: 110.8054,
  },
];

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
    description: 'Lubang sedalam 15 cm di lajur kiri membahayakan pengendara motor saat malam hari.',
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
    description: 'Tiga tiang lampu PJU padam sejak 3 hari lalu membuat jalanan gelap gulita.',
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
    description: 'Air meluap ke badan jalan setiap kali hujan deras turun lebih dari 30 menit.',
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
    description: 'Paving trotoar amblas sepanjang 3 meter dan berisiko membuat pejalan kaki tersandung.',
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
    description: 'Dahan pohon besar patah akibat angin kencang dan menghalangi jalur pejalan kaki.',
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