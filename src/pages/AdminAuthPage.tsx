import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

/**
 * Institutional UNKLAB Crest SVG Badge for Executive Portal
 */
const UnklabCrest: React.FC<{ className?: string }> = ({ className = 'h-12 w-12' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="adminGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#996515" />
      </linearGradient>
      <linearGradient id="adminNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#142D4E" />
        <stop offset="100%" stopColor="#070D18" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path
      d="M50 5 L88 20 C88 56 68 84 50 95 C32 84 12 20 12 20 Z"
      fill="url(#adminNavyGrad)"
      stroke="url(#adminGoldGrad)"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Inner Inset */}
    <path
      d="M50 12 L81 24 C81 53 64 77 50 86 C36 77 19 53 19 24 Z"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="1"
      strokeOpacity="0.4"
    />
    {/* Mount Klabat Silhouette */}
    <path
      d="M26 60 L42 38 L52 48 L60 40 L74 60 Z"
      fill="#D4AF37"
      fillOpacity="0.25"
    />
    {/* Radiating Star of Faith */}
    <circle cx="50" cy="28" r="4.5" fill="#FDE68A" />
    <path
      d="M50 18 L50 22 M50 34 L50 38 M40 28 L44 28 M56 28 L60 28"
      stroke="#FDE68A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Open Book of Knowledge */}
    <path
      d="M32 64 C38 60 46 61 50 64 C54 61 62 60 68 64 L68 76 C62 72 54 73 50 76 C46 73 38 72 32 76 Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
      stroke="#D4AF37"
      strokeWidth="1"
    />
    <path d="M50 64 L50 76" stroke="#070D18" strokeWidth="1.5" />
  </svg>
);

export const AdminAuthPage: React.FC = () => {
  const { loginAdminWithEmail, loginAdminWithGoogle } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Handle Admin Google Sign-In via Firebase
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const admin = await loginAdminWithGoogle();
      toast.success(`Terautentikasi sebagai ${admin.name} (${admin.role.replace('_', ' ')}).`);
      navigate('/admin-studio');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal login via Google';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Credentials Login
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = adminEmail.replace(/\s+/g, '').toLowerCase();
    const password = adminPassword.trim();

    if (!password || password.length < 6) {
      toast.error('Kata sandi administrator minimal 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      const fbAdmin = await loginAdminWithEmail(email, password);
      toast.success(`Terautentikasi sebagai ${fbAdmin.name} (${fbAdmin.role.replace('_', ' ')}).`);
      navigate('/admin-studio');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Autentikasi administrator gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070D18] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative selection:bg-[#D4AF37]/30 selection:text-[#FDE68A] antialiased overflow-x-hidden">
      {/* Subtle Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-25 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[160px]" />
      </div>

      {/* Top Header Bar: Navigasi Cepat Kembali ke Portal Mahasiswa */}
      <header className="w-full max-w-md flex justify-between items-center relative z-10 pt-2 pb-4">
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>
            Bukan Administrator? <strong className="text-slate-200 group-hover:text-amber-300">Portal Mahasiswa</strong>
          </span>
        </button>
      </header>

      {/* Main Centered Card Container */}
      <main className="w-full max-w-md relative z-10 my-auto py-2">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0A1220]/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header Title & Crest */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#142D4E]/80 to-[#070D18] border border-[#D4AF37]/50 flex items-center justify-center shadow-xl shadow-[#D4AF37]/10 ring-4 ring-[#D4AF37]/20 shrink-0 p-2 overflow-hidden bg-slate-900/50 backdrop-blur-sm">
              <img
                src="/unklab-logo.png"
                alt="Logo Universitas Klabat"
                className="h-full w-full object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] tracking-[0.25em] font-black uppercase text-[#D4AF37]">
                  UNIVERSITAS KLABAT
                </span>
                <span className="h-1 w-1 rounded-full bg-[#D4AF37]" />
                <span className="text-[11px] tracking-wider font-semibold text-slate-400">
                  EST. 1965
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2 mt-1">
                Klabat<span className="text-[#D4AF37]">Sync</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#D4AF37]/10 text-amber-200 border border-[#D4AF37]/25">
                  Admin Studio
                </span>
              </h1>
            </div>
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Autentikasi Administrator
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Masukkan kredensial resmi staf atau akun Super Admin UNKLAB.
              </p>
            </div>
          </div>

          {/* Official Google SSO Button for Admin / Staf */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 text-xs font-bold rounded-xl bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Masuk dengan Google</span>
          </Button>

          {/* Elegant Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              atau dengan kredensial staf
            </span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleAdminAuth} className="space-y-4">
            {/* Email Field without Domain Badge / Example */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-bold text-slate-300">
                Email Administrator Resmi
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Email"
                  className="pl-10 text-xs py-2.5 rounded-xl bg-slate-900/90 border-slate-700/80 text-white placeholder:text-slate-500 focus-visible:ring-[#D4AF37]/30 focus-visible:border-[#D4AF37]/80 transition-all"
                />
              </div>
            </div>

            {/* Password Field with Eye/EyeOff toggle */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-bold text-slate-300">
                Kata Sandi Administrator
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <Input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password"
                  className="pl-10 pr-10 text-xs py-2.5 rounded-xl bg-slate-900/90 border-slate-700/80 text-white placeholder:text-slate-500 focus-visible:ring-[#D4AF37]/30 focus-visible:border-[#D4AF37]/80 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400 hover:text-amber-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-amber-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Modern Eye-Catching Ambient Glow Login Button */}
            <div className="relative group w-full pt-2">
              {/* Outer Ambient Glow Aura */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-[#D4AF37] rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200" />
              
              {/* Core Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="relative w-full font-black text-sm py-3.5 rounded-xl bg-gradient-to-r from-[#0F2342] via-[#1E3A8A] to-[#2563EB] hover:from-[#142D4E] hover:via-[#1D4ED8] hover:to-[#3B82F6] border border-[#D4AF37]/60 group-hover:border-[#FDE68A] text-white shadow-2xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 overflow-hidden"
              >
                {/* Shimmer Light Sweep Effect on Hover */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[35deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                {loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FDE68A]" />
                    <span>Memverifikasi Hak Akses…</span>
                  </span>
                ) : (
                  <>
                    <span className="relative z-10 tracking-wider text-base drop-shadow-sm">Login Administrator</span>
                    <ArrowRight className="h-4 w-4 text-[#FDE68A] group-hover:translate-x-1.5 transition-transform duration-300 relative z-10 drop-shadow" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer: Institutional Security, Pathway to Excellence, & Copyright */}
      <footer className="w-full max-w-md text-center py-6 relative z-10 space-y-2 border-t border-slate-800/60 mt-auto">
        <div className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
          <span className="font-serif italic text-amber-200/90 tracking-wide text-xs">
            Pathway to Excellence
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
        </div>
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
          <span>Portal ini dikelola oleh Universitas Klabat untuk civitas akademika.</span>
        </p>
        <p className="text-[10px] text-slate-500">
          Hak Cipta &copy; 2026 Universitas Klabat (UNKLAB). All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminAuthPage;
