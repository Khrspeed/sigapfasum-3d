import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X, User, Phone, ArrowRight } from 'lucide-react';
import { GOOGLE_CLIENT_ID, parseGoogleJwt } from '../../utils/googleAuth';
import { useReports } from '../../context/ReportContext';

export default function AuthModal({ isOpen, onClose }) {
  const { loginUser } = useReports();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  if (!isOpen) return null;

  const isGoogleReady =
    GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('TEMPEL_GOOGLE_CLIENT_ID');

  const handleGoogleSuccess = (credentialResponse) => {
    const profile = parseGoogleJwt(credentialResponse.credential);
    if (profile) {
      loginUser({
        name: profile.name,
        email: profile.email,
        avatar: profile.picture,
        provider: 'google',
      });
      onClose();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    loginUser({
      name: name.trim(),
      contact: contact.trim(),
      avatar: null,
      provider: 'manual',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 pt-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center mx-auto shadow-md shadow-blue-500/30">
            SF
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 pt-2">Masuk Akun Warga</h3>
          <p className="text-xs text-slate-500">
            Gunakan akun Google atau isi nama agar laporanmu tercatat otomatis.
          </p>
        </div>

        {/* Tombol Login Google */}
        <div className="flex flex-col items-center">
          {isGoogleReady ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Gagal masuk dengan Google, silakan coba lagi.')}
              shape="pill"
              size="large"
              text="continue_with"
            />
          ) : (
            <button
              type="button"
              onClick={() =>
                alert('Isi GOOGLE_CLIENT_ID di src/utils/googleAuth.js terlebih dahulu.')
              }
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-[11px]">
                G
              </span>
              Lanjutkan dengan Akun Google
            </button>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">
            atau masuk manual
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Form Masuk / Daftar Warga */}
        <form onSubmit={handleManualSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkapmu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              No. WhatsApp / Email (Opsional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            Simpan & Lanjutkan <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}