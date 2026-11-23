import IsometricHero3D from "../components/ui/IsometricHero3D";

export default function SplashPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white flex flex-col items-center justify-center px-6 text-center">
      <IsometricHero3D />
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
        Sigap<span className="text-blue-600">Fasum</span>
      </h1>
      <p className="text-sm text-slate-500 mt-2 max-w-xs">
        Laporkan kerusakan fasilitas umum di sekitarmu dalam hitungan detik.
      </p>
      <div className="mt-8 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
