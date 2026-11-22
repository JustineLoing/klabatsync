import React, { useState } from 'react';
import {
  Palette,
  Bell,
  User,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Dialog } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';
import { UserPreferences, defaultPreferences } from '../types';
import { getRoleLabel } from '../utils/permissions';
import { toast } from 'sonner';

export interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, id }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
    <div className="space-y-0.5 pr-2">
      <label htmlFor={id} className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
        {label}
      </label>
      {description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed select-none">
          {description}
        </p>
      )}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#142D4E] dark:focus-visible:ring-[#D4AF37] ${
        checked ? 'bg-[#142D4E] dark:bg-[#D4AF37]' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const SettingsForm: React.FC<{ isPage?: boolean; onClose?: () => void }> = ({ isPage = false, onClose }) => {
  const {
    userPreferences,
    updateUserPreferences,
    resetUserPreferences,
    student,
    currentAdminUser,
    activeRole,
    firebaseUser,
    demoAuthUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState('appearance');
  const [draft, setDraft] = useState<UserPreferences>(() => {
    const base = userPreferences || defaultPreferences;
    return {
      ...defaultPreferences,
      ...base,
      notifications: {
        ...defaultPreferences.notifications,
        ...(base.notifications && typeof base.notifications === 'object' ? base.notifications : {}),
      },
    };
  });
  const [prevPreferences, setPrevPreferences] = useState<UserPreferences>(userPreferences);

  // Synchronize draft when userPreferences change from external source
  if (userPreferences !== prevPreferences) {
    setPrevPreferences(userPreferences);
    const base = userPreferences || defaultPreferences;
    setDraft({
      ...defaultPreferences,
      ...base,
      notifications: {
        ...defaultPreferences.notifications,
        ...(base.notifications && typeof base.notifications === 'object' ? base.notifications : {}),
      },
    });
  }

  const handleSave = () => {
    const safeDraft: UserPreferences = {
      ...defaultPreferences,
      ...(draft || {}),
      notifications: {
        ...defaultPreferences.notifications,
        ...(draft?.notifications && typeof draft.notifications === 'object' ? draft.notifications : {}),
      },
    };
    updateUserPreferences(safeDraft);
    toast.success('Pengaturan preferensi berhasil disimpan!');
    if (onClose) onClose();
  };

  const handleReset = () => {
    resetUserPreferences();
    setDraft(defaultPreferences);
    toast.info('Pengaturan preferensi dikembalikan ke bawaan sistem.');
  };

  // Determine user identity
  const isAdmin = activeRole !== 'student';
  const displayName = firebaseUser
    ? firebaseUser.displayName || 'Pengguna Terverifikasi'
    : isAdmin
      ? currentAdminUser?.name || 'Administrator KlabatSync'
      : demoAuthUser?.name || student.fullName || 'Mahasiswa UNKLAB';

  const displayEmail = firebaseUser
    ? firebaseUser.email || 'Email tidak tersedia'
    : isAdmin
      ? currentAdminUser?.email || 'admin@unklab.ac.id'
      : demoAuthUser?.email || student.email || 'student@student.unklab.ac.id';

  const roleTitle = getRoleLabel(activeRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#142D4E] to-[#1e4273] dark:from-[#D4AF37] dark:to-[#b39029] flex items-center justify-center text-white dark:text-slate-950 shadow-md">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Pengaturan & Preferensi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sesuaikan preferensi antarmuka, notifikasi, dan profil akun KlabatSync Anda.
          </p>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 gap-1 p-1.5 h-auto bg-slate-100 dark:bg-slate-800/90 rounded-2xl">
          <TabsTrigger
            value="appearance"
            className="flex items-center gap-1.5 py-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tampilan</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1.5 py-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 py-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger
            value="format"
            className="flex items-center gap-1.5 py-2 text-xs font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Format</span>
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: APPEARANCE / TAMPILAN                             */}
        {/* ======================================================== */}
        <TabsContent value="appearance" className="space-y-5 pt-2">
          {/* Theme Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tema Antarmuka
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'light' as const,
                  label: 'Terang',
                  desc: 'Palet terang UNKLAB',
                  icon: Sun,
                  previewClass: 'bg-slate-50 border-slate-200 text-slate-900',
                },
                {
                  id: 'dark' as const,
                  label: 'Gelap',
                  desc: 'Kontras malam hari',
                  icon: Moon,
                  previewClass: 'bg-slate-950 border-slate-800 text-slate-100',
                },
                {
                  id: 'system' as const,
                  label: 'Sistem',
                  desc: 'Ikuti perangkat Anda',
                  icon: Monitor,
                  previewClass: 'bg-gradient-to-r from-slate-100 to-slate-900 border-slate-300 text-slate-700',
                },
              ].map((themeOption) => {
                const currentTheme = draft?.theme ?? defaultPreferences.theme;
                const isSelected = currentTheme === themeOption.id;
                const IconComponent = themeOption.icon;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...defaultPreferences,
                        ...(prev || {}),
                        theme: themeOption.id,
                      }))
                    }
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#142D4E] bg-blue-50/50 dark:border-[#D4AF37] dark:bg-amber-950/20 shadow-xs ring-2 ring-[#142D4E]/20 dark:ring-[#D4AF37]/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#142D4E] text-white dark:bg-[#D4AF37] dark:text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#142D4E] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {themeOption.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {themeOption.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Density & Visual Options */}
          <div className="space-y-1 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/40">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Tata Letak & Kenyamanan Visual
            </h3>
            <Toggle
              id="pref-compact"
              checked={draft?.compactMode ?? defaultPreferences.compactMode}
              onChange={(val) =>
                setDraft((prev) => ({
                  ...defaultPreferences,
                  ...(prev || {}),
                  compactMode: val,
                }))
              }
              label="Mode Tampilan Ringkas"
              description="Mengoptimalkan jarak elemen agar lebih banyak informasi ditampilkan pada layar laptop atau monitor."
            />
            <Toggle
              id="pref-reduced-motion"
              checked={draft?.reducedMotion ?? defaultPreferences.reducedMotion}
              onChange={(val) =>
                setDraft((prev) => ({
                  ...defaultPreferences,
                  ...(prev || {}),
                  reducedMotion: val,
                }))
              }
              label="Kurangi Animasi & Transisi"
              description="Meminimalkan animasi halaman untuk aksesibilitas dan efisiensi konsumsi daya perangkat."
            />
            <Toggle
              id="pref-presentation-mode"
              checked={draft?.presentationMode ?? defaultPreferences.presentationMode}
              onChange={(val) =>
                setDraft((prev) => ({
                  ...defaultPreferences,
                  ...(prev || {}),
                  presentationMode: val,
                }))
              }
              label="Mode Presentasi Kampus"
              description="Meningkatkan ketajaman kontras dan pembacaan teks untuk proyektor auditorium atau layar besar."
            />
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: NOTIFICATIONS / NOTIFIKASI                        */}
        {/* ======================================================== */}
        <TabsContent value="notifications" className="space-y-4 pt-2">
          {(() => {
            const notifications = draft?.notifications || defaultPreferences.notifications;
            return (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-slate-800">
                <Toggle
                  id="notif-event"
                  checked={notifications.eventReminders ?? defaultPreferences.notifications.eventReminders}
                  onChange={(val) =>
                    setDraft((prev) => {
                      const currentDraft = prev || defaultPreferences;
                      const currentNotifs = currentDraft.notifications || defaultPreferences.notifications;
                      return {
                        ...defaultPreferences,
                        ...currentDraft,
                        notifications: { ...currentNotifs, eventReminders: val },
                      };
                    })
                  }
                  label="Pengingat Kegiatan Terdaftar"
                  description="Terima pemberitahuan jadwal sebelum seminar, workshop, atau kegiatan kampus dimulai."
                />
                <Toggle
                  id="notif-chapel"
                  checked={notifications.chapelAlerts ?? defaultPreferences.notifications.chapelAlerts}
                  onChange={(val) =>
                    setDraft((prev) => {
                      const currentDraft = prev || defaultPreferences;
                      const currentNotifs = currentDraft.notifications || defaultPreferences.notifications;
                      return {
                        ...defaultPreferences,
                        ...currentDraft,
                        notifications: { ...currentNotifs, chapelAlerts: val },
                      };
                    })
                  }
                  label="Peringatan Ibadah Pioneer Chapel"
                  description="Peringatan menjelang ibadah chapel dan laporan pencapaian Chapel Point per semester."
                />
                <Toggle
                  id="notif-announcement"
                  checked={notifications.academicAnnouncements ?? defaultPreferences.notifications.academicAnnouncements}
                  onChange={(val) =>
                    setDraft((prev) => {
                      const currentDraft = prev || defaultPreferences;
                      const currentNotifs = currentDraft.notifications || defaultPreferences.notifications;
                      return {
                        ...defaultPreferences,
                        ...currentDraft,
                        notifications: { ...currentNotifs, academicAnnouncements: val },
                      };
                    })
                  }
                  label="Pengumuman Akademik & Edaran Resmi"
                  description="Pemberitahuan surat edaran dari Rektorat, Dekanat, atau Badan Eksekutif Mahasiswa."
                />
                <Toggle
                  id="notif-toasts"
                  checked={notifications.inAppToasts ?? defaultPreferences.notifications.inAppToasts}
                  onChange={(val) =>
                    setDraft((prev) => {
                      const currentDraft = prev || defaultPreferences;
                      const currentNotifs = currentDraft.notifications || defaultPreferences.notifications;
                      return {
                        ...defaultPreferences,
                        ...currentDraft,
                        notifications: { ...currentNotifs, inAppToasts: val },
                      };
                    })
                  }
                  label="Notifikasi Mengambang (In-App Toasts)"
                  description="Tampilkan umpan balik instan di pojok layar saat pendaftaran kegiatan atau check-in berhasil."
                />
                <Toggle
                  id="notif-email"
                  checked={notifications.emailDigest ?? defaultPreferences.notifications.emailDigest}
                  onChange={(val) =>
                    setDraft((prev) => {
                      const currentDraft = prev || defaultPreferences;
                      const currentNotifs = currentDraft.notifications || defaultPreferences.notifications;
                      return {
                        ...defaultPreferences,
                        ...currentDraft,
                        notifications: { ...currentNotifs, emailDigest: val },
                      };
                    })
                  }
                  label="Ringkasan Email Mingguan"
                  description="Kirimkan ringkasan jadwal kegiatan dan evaluasi poin chapel mingguan ke email institusi Anda."
                />
              </div>
            );
          })()}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: PROFILE & IDENTITY / PROFIL & AKUN                */}
        {/* ======================================================== */}
        <TabsContent value="profile" className="space-y-4 pt-2">
          {/* Identity Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/20 via-slate-900/10 to-transparent border border-blue-500/20 dark:border-blue-400/20 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#142D4E] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {displayName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                  <CheckCircle2 className="h-3 w-3" />
                  {roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Institutional Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Peran Pengguna
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {roleTitle}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Fakultas / Unit
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {!isAdmin && student?.faculty ? student.faculty : 'Fakultas Ilmu Komputer (FIK)'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Status Domisili Kampus
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {!isAdmin && student?.residenceStatus === 'dormitory'
                  ? 'Asrama Mahasiswa UNKLAB'
                  : 'Luar Asrama (Off-Campus)'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Zona Waktu Kampus
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>{draft?.timezone ?? defaultPreferences.timezone}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              Profil disinkronkan secara aman via Google SSO & Firebase Authentication Universitas Klabat.
            </span>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: LANGUAGE & FORMAT / BAHASA & FORMAT               */}
        {/* ======================================================== */}
        <TabsContent value="format" className="space-y-4 pt-2">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bahasa Antarmuka
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'id' as const, label: 'Bahasa Indonesia', badge: 'Standar Kampus' },
                { id: 'en' as const, label: 'English (US)', badge: 'International' },
              ].map((lang) => {
                const isSelected = (draft?.language ?? defaultPreferences.language) === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...defaultPreferences,
                        ...(prev || {}),
                        language: lang.id,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#142D4E] bg-blue-50/50 dark:border-[#D4AF37] dark:bg-amber-950/20 ring-2 ring-[#142D4E]/20 dark:ring-[#D4AF37]/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {lang.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {lang.badge}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-[#142D4E] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Format */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Format Tampilan Jam
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '24h' as const, label: 'Format 24 Jam', sample: '18:30 WITA' },
                { id: '12h' as const, label: 'Format 12 Jam (AM/PM)', sample: '06:30 PM WITA' },
              ].map((fmt) => {
                const isSelected = (draft?.timeFormat ?? defaultPreferences.timeFormat) === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...defaultPreferences,
                        ...(prev || {}),
                        timeFormat: fmt.id,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#142D4E] bg-blue-50/50 dark:border-[#D4AF37] dark:bg-amber-950/20 ring-2 ring-[#142D4E]/20 dark:ring-[#D4AF37]/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {fmt.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Contoh: {fmt.sample}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-[#142D4E] dark:bg-[#D4AF37] text-white dark:text-slate-950 flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone Info Banner */}
          <div className="p-3.5 rounded-2xl border border-[#D4AF37]/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Standar Zona Waktu Kampus Airmadidi</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              Seluruh jadwal ibadah Pioneer Chapel, seminar, dan tenggat waktu registrasi disinkronkan dengan Waktu Indonesia Tengah (WITA / UTC+8).
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Kembalikan Default
        </Button>

        <div className="flex items-center gap-2">
          {!isPage && onClose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="text-xs font-bold bg-[#142D4E] hover:bg-[#1a3860] dark:bg-[#D4AF37] dark:hover:bg-[#b89528] text-white dark:text-slate-950 cursor-pointer shadow-sm"
          >
            <Check className="h-3.5 w-3.5 mr-1.5 stroke-[2.5]" />
            Simpan Preferensi
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { isSettingsOpen, setIsSettingsOpen } = useApp();

  const isOpen = open !== undefined ? open : isSettingsOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setIsSettingsOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen} className="max-w-2xl">
      <SettingsForm onClose={() => setOpen(false)} />
    </Dialog>
  );
};
