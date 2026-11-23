# KlabatSync

**Satu kampus, tetap terhubung.** KlabatSync membantu komunitas Universitas Klabat menemukan kegiatan kampus, membaca pengumuman, dan mengelola agenda pribadi.

## Fitur

- Temukan kegiatan kampus dan lihat informasi serta pengumumannya.
- Kelola pendaftaran kegiatan, agenda pribadi, dan acara tersimpan.
- Sediakan halaman administrasi untuk kegiatan, organisasi, dan pengumuman sesuai peran pengguna.
- Gunakan Demo Mode dengan data contoh tanpa perlu terhubung ke Firebase.

## Teknologi

- React 19, TypeScript, dan Vite
- Tailwind CSS
- Firebase Authentication, Cloud Firestore, dan Cloud Functions

## Menjalankan secara lokal

Persyaratan: Node.js 20 atau lebih baru dan npm.

```powershell
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan Vite, biasanya `http://localhost:5173`. Perintah di atas dijalankan dari root repository dan Demo Mode tidak memerlukan konfigurasi Firebase.

Untuk layanan Firebase, salin `.env.example` menjadi `.env`, lalu isi variabel `VITE_FIREBASE_*` dengan konfigurasi aplikasi web Firebase milikmu. Jangan commit file `.env`.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Menjalankan Oxlint pada `src` |
| `npm run build` | Memeriksa TypeScript dan membuat build produksi |
| `npm run preview` | Meninjau build produksi secara lokal |

Saat ini `package.json` belum menyediakan skrip `test`.

## Mode aplikasi dan Firebase

- **Demo Mode** memakai data contoh dan penyimpanan lokal browser. Mode ini tidak memerlukan login Firebase atau penulisan data ke Firestore.
- **Mode Firebase** memerlukan konfigurasi Firebase yang valid. Kode aplikasi mencakup alur autentikasi dan sinkronisasi Firestore untuk profil, kegiatan, organisasi, pengumuman, pendaftaran, bookmark, serta agenda.
- Kode konfigurasi dan fungsi Firebase bukan bukti bahwa layanan sudah aktif di suatu proyek. Firebase Authentication, Firestore, Security Rules, Cloud Functions, dan pengaturan lain harus disiapkan atau dideploy secara terpisah.

Sebelum deployment, periksa proyek yang dituju di `.firebaserc` dan konfigurasi pada Firebase Console. Deployment tidak dijalankan oleh perintah `npm run build`.

### Langkah Firebase yang perlu dilakukan manual

1. Pastikan project ID di `.firebaserc` memang proyek yang akan digunakan.
2. Aktifkan provider Google dan Email/Password di Firebase Authentication, lalu atur domain yang diizinkan.
3. Siapkan Firestore dan tinjau `firestore.rules` sebelum menerapkannya.
4. Atur secret `SUPER_ADMIN_BOOTSTRAP_KEY` untuk Cloud Functions sebelum menggunakan bootstrap administrator pertama.
5. Setelah meninjau konfigurasi dan aturan, deploy secara eksplisit dengan Firebase CLI, misalnya `firebase deploy --only firestore:rules,functions`.

README ini tidak menyatakan Rules atau Functions telah dideploy. Verifikasi statusnya di proyek Firebase yang dituju.

### Catatan konfigurasi AI

AI memakai mock adapter jika tidak ada endpoint backend atau kunci Gemini yang dikonfigurasi. `VITE_*` adalah variabel sisi klien yang dapat terlihat pada bundle aplikasi. Jangan gunakan `VITE_GEMINI_API_KEY` untuk menyimpan kunci rahasia produksi; gunakan backend yang menyimpan kunci di sisi server.

## Struktur utama

```text
src/
  components/   Komponen antarmuka
  context/      State aplikasi dan sinkronisasi
  data/         Data contoh untuk Demo Mode
  pages/        Halaman mahasiswa dan administrator
  services/     Firebase, AI, kegiatan, dan kehadiran
  types/        Tipe data TypeScript
functions/      Firebase Cloud Functions
firestore.rules Firestore Security Rules
firebase.json   Konfigurasi Firebase CLI
```
