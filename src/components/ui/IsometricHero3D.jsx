export default function IsometricHero3D() {
  return (
    <div className="relative flex items-center justify-center py-4 animate-float-3d">
      <div className="absolute w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />
      <svg
        viewBox="0 0 260 200"
        className="w-60 h-44 drop-shadow-[0_18px_20px_rgba(37,99,235,0.22)]"
        fill="none"
      >
        {/* Platform Tanah Isometrik 3D */}
        <polygon points="130,175 30,125 130,75 230,125" fill="#DBEAFE" />
        <polygon points="30,125 130,175 130,188 30,138" fill="#93C5FD" />
        <polygon points="230,125 130,175 130,188 230,138" fill="#60A5FA" />

        {/* Jalan Raya Isometrik */}
        <polygon points="75,148 175,98 195,108 95,158" fill="#334155" />
        <line
          x1="90"
          y1="150"
          x2="180"
          y2="105"
          stroke="#FBBF24"
          strokeWidth="3"
          strokeDasharray="8 6"
        />

        {/* Gedung 3D */}
        <polygon points="65,112 95,97 95,55 65,70" fill="#2563EB" />
        <polygon points="95,97 120,110 120,68 95,55" fill="#1D4ED8" />
        <polygon points="65,70 95,55 120,68 90,83" fill="#60A5FA" />

        {/* Pin Lokasi 3D Melayang */}
        <g transform="translate(132, 24)">
          <ellipse cx="18" cy="76" rx="14" ry="6" fill="rgba(15,23,42,0.18)" />
          <path
            d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 52 18 52C18 52 36 31.5 36 18C36 8.06 27.94 0 18 0Z"
            fill="#F59E0B"
          />
          <circle cx="18" cy="18" r="7" fill="#FFFFFF" />
        </g>

        {/* Kerucut Pembatas Jalan 3D */}
        <polygon points="150,126 158,106 166,126" fill="#F97316" />
        <ellipse cx="158" cy="126" rx="10" ry="4" fill="#EA580C" />
      </svg>
    </div>
  );
}
