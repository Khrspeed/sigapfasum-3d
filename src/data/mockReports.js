export const FACILITY_CATEGORIES = [
  {
    id: "jalan",
    label: "Jalan Rusak",
    color: "from-amber-400 to-orange-500",
    icon: "Construction",
  },
  {
    id: "lampu",
    label: "Lampu PJU",
    color: "from-yellow-400 to-amber-500",
    icon: "Lightbulb",
  },
  {
    id: "drainase",
    label: "Drainase",
    color: "from-cyan-400 to-blue-500",
    icon: "Waves",
  },
  {
    id: "taman",
    label: "Taman Kota",
    color: "from-emerald-400 to-green-600",
    icon: "Trees",
  },
  {
    id: "halte",
    label: "Halte & Trotoar",
    color: "from-indigo-400 to-purple-600",
    icon: "Bus",
  },
];

export const INITIAL_REPORTS = [
  {
    id: "SF-2026-001",
    title: "Jalan Berlubang Kawasan Simpang Tujuh",
    category: "jalan",
    location: "Jl. Simpang Tujuh, Kec. Kota Kudus",
    description:
      "Lubang sedalam 15 cm di lajur kiri membahayakan pengendara motor saat malam hari.",
    status: "Diproses",
    reporter: "Rasyad Habibie",
    createdAt: "2026-11-20",
    image:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "SF-2026-002",
    title: "Lampu Penerangan Jalan Mati Total",
    category: "lampu",
    location: "Jl. Jenderal Sudirman, Rendeng, Kudus",
    description:
      "Tiga tiang lampu PJU padam sejak 3 hari lalu membuat jalanan gelap gulita.",
    status: "Menunggu",
    reporter: "Siti Nurhaliza",
    createdAt: "2026-11-21",
    image:
      "https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "SF-2026-003",
    title: "Saluran Air Tersumbat Sampah & Endapan",
    category: "drainase",
    location: "Jl. Sunan Muria, Barongan, Kudus",
    description:
      "Air meluap ke badan jalan setiap kali hujan deras turun lebih dari 30 menit.",
    status: "Selesai",
    reporter: "Budi Santoso",
    createdAt: "2026-11-18",
    image:
      "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80",
  },
];
