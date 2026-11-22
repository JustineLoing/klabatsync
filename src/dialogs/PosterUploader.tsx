import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { CampusEvent, PosterExtractionResult } from '../types';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const eventFormSchema = z.object({
  title: z.string().min(3, 'Event title is required'),
  category: z.enum(['spiritual', 'academic', 'ormawa', 'dormitory', 'seminar', 'competition']),
  organizer: z.string().min(2, 'Organizer name is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:mm'),
  endTime: z.string().optional(),
  location: z.string().min(2, 'Venue location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dressCode: z.string().optional(),
  chapelPoints: z.number().min(0).max(5).default(0),
  capacity: z.number().min(0).optional(),
  registrationDeadline: z.string().optional(),
  dormitoryOnly: z.boolean().default(false),
  contactInfo: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface PosterUploaderProps {
  onSuccess?: (event: CampusEvent) => void;
}

export const PosterUploader: React.FC<PosterUploaderProps> = ({ onSuccess }) => {
  const { createEvent } = useApp();

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<PosterExtractionResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      category: 'academic',
      chapelPoints: 0,
      dormitoryOnly: false,
    },
  });

  // Handle Drag & Drop / File Upload
  const handleFileChange = (file: File) => {
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPosterPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.info(`Poster "${file.name}" berhasil diunggah. Klik "Ekstrak informasi dengan AI" untuk memproses.`);
  };

  // Run AI Extraction with scanning animation
  const runExtraction = async () => {
    if (!posterFile && !posterPreview) {
      toast.error('Silakan unggah poster kegiatan terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    setScanProgress(15);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const target = posterFile || posterPreview!;
      const result = await aiService.extractPoster(target);

      clearInterval(interval);
      setScanProgress(100);
      setExtractionResult(result);

      // Populate form
      setValue('title', result.title);
      setValue('category', result.category);
      setValue('organizer', result.organizer);
      setValue('startDate', result.startDate);
      setValue('endDate', result.endDate);
      setValue('startTime', result.startTime);
      setValue('endTime', result.endTime || '');
      setValue('location', result.location);
      setValue('description', result.description);
      setValue('dressCode', result.dressCode || '');
      setValue('chapelPoints', result.chapelPoints || 0);
      setValue('capacity', result.capacity || undefined);
      setValue('registrationDeadline', result.registrationDeadline || '');
      setValue('dormitoryOnly', result.dormitoryOnly || false);
      setValue('contactInfo', result.contactInfo || '');

      if (result.missingFields && result.missingFields.length > 0) {
        toast.warning(
          `Ekstraksi AI selesai: ${result.missingFields.length} bidang memerlukan tinjauan. Periksa formulir sebelum menerbitkan.`
        );
      } else {
        toast.success('Informasi poster berhasil diekstrak dan dipetakan ke formulir kegiatan!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ekstraksi poster gagal.';
      toast.error(`Gagal mengekstrak poster: ${msg}`);
    } finally {
      setTimeout(() => setIsScanning(false), 400);
    }
  };

  const onSubmit = (data: EventFormData) => {
    const newEvent = createEvent({
      title: data.title,
      description: data.description,
      category: data.category,
      organizer: data.organizer,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
      location: data.location,
      dressCode: data.dressCode || undefined,
      chapelPoints: data.chapelPoints,
      capacity: data.capacity,
      registeredCount: 0,
      registrationDeadline: data.registrationDeadline,
      dormitoryOnly: data.dormitoryOnly,
      contact: data.contactInfo
        ? { name: data.organizer, email: data.contactInfo }
        : undefined,
      status: 'published',
      isVerified: true,
      isDemo: false,
      posterGradient:
        data.category === 'spiritual'
          ? 'from-violet-900 via-indigo-950 to-purple-950'
          : data.category === 'academic'
          ? 'from-blue-900 via-cyan-950 to-slate-950'
          : 'from-amber-900 via-orange-950 to-zinc-950',
    });

    toast.success(`Kegiatan "${data.title}" berhasil diterbitkan ke kalender dan eksplorasi agenda!`);
    if (onSuccess) onSuccess(newEvent);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Instructions */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200/80 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-purple-600/20">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Ekstraksi Poster Cerdas AI
              <Badge variant="purple" className="text-[10px]">
                Multimodal Gemini 3 Flash
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unggah poster resmi kegiatan kampus UNKLAB. AI akan membaca visual poster secara cerdas untuk memetakan nama kegiatan, jadwal, tempat, narahubung, dan poin chapel.
            </p>
          </div>
        </div>
      </div>

      {/* Split-Screen Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: POSTER UPLOAD & PREVIEW (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Unggah Poster
              </span>
              {posterPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPosterPreview(null);
                    setPosterFile(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Hapus
                </button>
              )}
            </div>

            {/* Drag & Drop or Preview Area */}
            {!posterPreview ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer group text-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tarik & letakkan poster kampus di sini
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Format berkas: PNG, JPG, JPEG, WEBP (Maksimal 10MB)
                </p>
                <span className="mt-4 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  Pilih Berkas Poster
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center min-h-[360px]">
                {/* Poster Graphic Render */}
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="max-h-[440px] w-full object-contain rounded-xl"
                />

                {/* Scanning Line Animation Effect */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none bg-purple-950/20 backdrop-blur-[1px]">
                    <div className="w-full h-1.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan absolute" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-2xl bg-slate-900/90 text-white border border-purple-400/40 text-xs font-bold flex items-center gap-2 shadow-2xl">
                        <Sparkles className="h-4 w-4 text-cyan-300 animate-spin" />
                        <span>AI Memindai Visual Poster ({scanProgress}%)...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extract CTA Button */}
            <Button
              type="button"
              variant="purple"
              disabled={!posterPreview || isScanning}
              onClick={() => runExtraction()}
              className="w-full font-bold shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-1.5 text-amber-300" />
              {isScanning ? 'Mengekstrak Informasi Poster...' : 'Ekstrak informasi dengan AI'}
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: STRUCTURED EVENT INFORMATION FORM (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  2. Review &amp; Edit Structured Event Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fields populated by AI. Correct any details before publishing.
                </p>
              </div>
              {extractionResult && (
                <Badge
                  variant={extractionResult.missingFields.length > 0 ? 'amber' : 'success'}
                  className="text-xs font-bold"
                >
                  {extractionResult.missingFields.length > 0
                    ? `${extractionResult.missingFields.length} Missing Fields`
                    : '100% Extracted'}
                </Badge>
              )}
            </div>

            {/* Missing Fields Warning Alert */}
            {extractionResult && extractionResult.missingFields.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Missing Information Detected:</span>
                  <p className="mt-0.5">
                    The uploaded poster did not specify:{' '}
                    <span className="font-semibold underline">
                      {extractionResult.missingFields.join(', ')}
                    </span>
                    . Please supply these values manually below.
                  </p>
                </div>
              </div>
            )}

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Event Title *
                </label>
                <Input
                  placeholder="e.g. FIK AI & Cloud Hackathon"
                  {...register('title')}
                  error={errors.title?.message}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="academic">Academic</option>
                  <option value="spiritual">Spiritual / Chapel</option>
                  <option value="ormawa">ORMAWA / BEM</option>
                  <option value="dormitory">Dormitory</option>
                  <option value="seminar">Seminar</option>
                  <option value="competition">Competition</option>
                </select>
              </div>
            </div>

            {/* Organizer & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Organizer *
                </label>
                <Input
                  placeholder="e.g. HMP Informatika / BEM UNKLAB"
                  {...register('organizer')}
                  error={errors.organizer?.message}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Location / Venue *
                </label>
                <Input
                  placeholder="e.g. Pioneer Chapel / Auditorium GK1"
                  {...register('location')}
                  error={errors.location?.message}
                />
              </div>
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Date *
                </label>
                <Input type="date" {...register('startDate')} error={errors.startDate?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Date *
                </label>
                <Input type="date" {...register('endDate')} error={errors.endDate?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Time *
                </label>
                <Input type="time" {...register('startTime')} error={errors.startTime?.message} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    End Time
                  </label>
                  {extractionResult?.missingFields.includes('endTime') && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      MISSING
                    </span>
                  )}
                </div>
                <Input
                  type="time"
                  placeholder="HH:mm"
                  className={
                    extractionResult?.missingFields.includes('endTime')
                      ? 'border-amber-400 bg-amber-50/30'
                      : ''
                  }
                  {...register('endTime')}
                />
              </div>
            </div>

            {/* Dress Code & Chapel Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dress Code
                  </label>
                  {extractionResult?.missingFields.includes('dressCode') && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      MISSING
                    </span>
                  )}
                </div>
                <Input
                  placeholder="e.g. Formal Sabbath Attire / Smart Casual"
                  className={
                    extractionResult?.missingFields.includes('dressCode')
                      ? 'border-amber-400 bg-amber-50/30'
                      : ''
                  }
                  {...register('dressCode')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chapel Points (0 to 5)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  {...register('chapelPoints', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Event Description *
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive announcement details, rundown, speaker information..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 font-medium">{errors.description.message}</p>
              )}
            </div>

            {/* Dormitory Only Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="dormitoryOnly"
                {...register('dormitoryOnly')}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="dormitoryOnly"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Restrict eligibility to Dormitory Residents Only (Edelweiss, Jasmine, Crystal)
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset()}
                className="text-xs text-slate-500"
              >
                Clear Form
              </Button>
              <Button type="submit" variant="primary" className="font-bold text-xs px-6">
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Publish Campus Activity
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
