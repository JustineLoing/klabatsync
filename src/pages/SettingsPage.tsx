import React from 'react';
import { Sliders, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { SettingsForm } from '../dialogs/SettingsModal';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeRole } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(activeRole === 'student' ? '/overview' : '/admin-studio')}
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Kembali ke {activeRole === 'student' ? 'Ringkasan' : 'Studio'}
        </Button>

        <Badge variant="blue" className="text-[10px] font-bold">
          PREFERENSI PENGGUNA
        </Badge>
      </div>

      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#142D4E] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Pengaturan Akun & Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Konfigurasi tampilan visual, saluran notifikasi, dan preferensi akun Universitas Klabat Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        <SettingsForm isPage={true} />
      </div>
    </div>
  );
};

export default SettingsPage;
