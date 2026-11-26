import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { X, User, Phone, ArrowRight } from 'lucide-react';
import { parseGoogleJwt } from '../../utils/googleAuth';
import { useReports } from '../../context/ReportContext';

export default function AuthModal({ isOpen, onClose }) {
  const { loginUser } = useReports();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  if (!isOpen) return null;

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
    setName('');
    setContact('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
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
            Login menggunakan akun Google atau isi namamu agar tercatat saat melapor.
          </p>
        </div>

        {/* Tombol Login Google Asli */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Login Google gagal. Cek kembali Authorized JavaScript origins di Google Cloud Console.')}
            shape="pill"
            size="large"
            text="continue_with"
          />
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">
            atau isi nama warga
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Form Nama Warga */}
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