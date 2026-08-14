# SiPKL — Sistem Informasi PKL SMK N 1 Magelang

Sistem Informasi Praktik Kerja Lapangan (PKL) terpadu yang dilengkapi dengan fitur Geotagging dan Face Recognition untuk validasi absensi (anti-fake GPS & anti-titip absen). Dibangun menggunakan SvelteKit & Supabase.

## 🚀 Fase Pengembangan (Roadmap)

Proyek ini dibangun berdasarkan tahapan eksekusi ketat berikut:

1. **FASE 0 — Project Initialization** (Selesai)
   - Setup SvelteKit, dependencies, Supabase JS, copy face-api assets.
2. **FASE 1 — Design System & Global Styles** (Selesai)
   - Implementasi tema Luxury/Editorial Biru Tosca, shared components (Button, Card, dll).
3. **FASE 2 — Database Schema** (Selesai)
   - Skema 11 tabel (Profil, Master Data, Transaksi PKL) + Seed Data.
4. **FASE 3 — Supabase Client & Auth Store** (Selesai)
   - Koneksi Supabase, manajemen sesi, dan state profil user.
5. **FASE 4 — Utilities & Face API** (Selesai)
   - Modul `haversine` (radius), `geolocation`, `timeValidator` (06-09 & 14-18), dan Face API loader.
6. **FASE 5 — Routing & Layout**
   - Setup App Shell (Sidebar, Navbar), Auth Guard, Halaman Login.
7. **FASE 6 — Modul Absensi (Siswa)**
   - Integrasi kamera, pencocokan wajah `face-api.js`, dan radius GPS.
8. **FASE 7 — Modul Jurnal & Laporan (Siswa)**
   - CRUD jurnal kegiatan harian dan upload laporan akhir (PDF).
9. **FASE 8 — Modul Validasi (Pembimbing Industri)**
   - Approval/Reject jurnal harian oleh DUDI.
10. **FASE 9 — Modul Monitoring (Guru)**
    - Pemantauan absensi, jurnal, dan laporan siswa bimbingan.
11. **FASE 10 — Modul Admin**
    - Master data CRUD dan registrasi wajah (Face Profile).
12. **FASE 11 — PWA Setup**
    - Konfigurasi manifest dan service worker agar bisa diinstall seperti aplikasi native.

## 💻 Cara Menjalankan Lokal

```bash
npm install
npm run dev
```

Pastikan Anda sudah mengisi file `.env.local` dengan kredensial Supabase Anda.
