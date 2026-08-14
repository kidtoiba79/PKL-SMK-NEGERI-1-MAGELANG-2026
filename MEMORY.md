# Project Memory & Documentation (SiPKL SMK N 1 Magelang)

## 1. Project Identity
- **Name**: Sistem Informasi PKL (SiPKL) SMK Negeri 1 Magelang
- **Stack**: SvelteKit (Vite), Supabase (PostgreSQL + Storage), Vanilla CSS, jsPDF, XLSX, Chart.js
- **Design Philosophy**: Luxury, Editorial, Modern (Color Palette: Biru Tosca/Sky Blue `#0ea5e9`, Dark Surface `#1e293b`).
- **Core Features**: Geofenced Attendance dengan Visual Map & Validasi Akurasi GPS, Face Recognition Liveness (Auto-capture), Pengajuan Izin/Sakit + Bukti Surat, Offline Draft Jurnal Siswa, Rekapitulasi Ekspor PDF (KOP Resmi Sekolah) & Excel, Live TV Monitor Command Center, PDF Report, dan Role Management (Siswa, Guru, DUDI/Perusahaan, Admin).
- **GitHub Repository**: `https://github.com/kidtoiba79/PKL-SMK-NEGERI-1-MAGELANG-2026.git`

## 2. Supabase Infrastructure
- **Project URL**: `https://zsrhkdnumrifnjrqjljr.supabase.co`
- **Database Rules (RLS)**: Row Level Security is active for all 11 tables.
- **Storage**: Requires a public bucket named `berkas_pkl` (For student PDF reports & surat izin lampiran).
- **Authentication**: `auth.users` automatically syncs to `public.users_profile` via Postgres Trigger (`handle_new_user`).

## 3. Database Schema (11 Tables)
1. `users_profile`: Extends Auth. Contains `role` (admin, siswa, guru, dudi) and `nama`.
2. `perusahaan`: Master DUDI. Holds geofence data (`lat`, `lng`, `radius_meter`).
3. `siswa`: Master student data (`nis`, `kelas`, `jurusan`).
4. `guru_pembimbing`: Master teacher data (`nip`).
5. `pembimbing_industri`: Master DUDI mentor data.
6. `periode_pkl`: Active period management.
7. `penempatan`: Pivot table connecting Student <-> Company <-> Teacher <-> DUDI <-> Period.
8. `absensi_pkl`: Logs check-in/out timestamps, coordinates, face recognition confidence score, `keterangan_izin`, and `surat_izin_url`.
9. `jurnal_kegiatan`: Daily logs by students. Validated by DUDI.
10. `laporan_akhir`: PDF submission by students. Graded by Teacher.
11. `face_profiles`: JSONB descriptors for student face biometrics (no images stored).

## 4. Key Workflows & Features
- **Face Recognition**: Handled locally on the client using `face-api.js`.
  - *Registration (Admin)*: Extracts numerical descriptors and saves them to `face_profiles`.
  - *Attendance (Siswa)*: Auto-capture frame, checks liveness (smile > 0.6), matches Euclidean distance, and auto-submits.
- **Pengajuan Izin & Sakit**: Formulir di `/siswa/absensi` untuk mengajukan izin/sakit beserta upload bukti surat dokter/keterangan yang dapat langsung diverifikasi Guru dan DUDI.
- **Offline Draft Jurnal**: Auto-save draft kegiatan di `localStorage` saat mengetik jurnal, dengan notifikasi status pemulihan otomatis.
- **Ekspor PDF & Excel Resmi**: Modul `src/lib/exportHelper.js` men-generate dokumen ber-KOP resmi SMK Negeri 1 Magelang dan format Excel multi-sheet terstruktur.
- **Geofencing & Visual Map**: Menggunakan Haversine formula dengan validasi akurasi sinyal GPS (`coords.accuracy`) dan deteksi sinyal bias.
- **TV Command Center**: Admin dashboard khusus layar TV dengan tema Biru Tosca/Deep Teal.

## 5. File Structure Highlights
- `/src/lib/exportHelper.js`: PDF (jsPDF + autoTable) & Excel exporter.
- `/src/lib/components/Skeleton.svelte`: Shimmer skeleton loading placeholder.
- `/src/lib/components/LocationBadge.svelte`: Badge akurasi GPS dan jarak meter.
- `/src/routes/(app)/`:
  - `/admin`: Master data CRUD, visual analytics chart, Face Registration, Mass Account Generation.
  - `/admin/monitor-tv`: Live TV Command Center.
  - `/siswa`: Presensi Hadir (Wajah), Pengajuan Izin/Sakit, Jurnal Auto-Draft, PDF Report upload.
  - `/guru`: Dashboard pemantauan kehadiran & breakdown chart, unduh rekap PDF/Excel, jurnal monitoring, grading laporan.
  - `/pembimbing-industri`: Absensi monitoring dengan lampiran surat izin, persetujuan jurnal harian.
- `/.graphifyignore`: Mengabaikan vendor `static/face-api/` dan build artifacts agar analisis graphify bersih.

## 6. How to Run Locally
1. Run `start_sipkl.bat` (Executing `npm run dev -- --open`).
2. Login with Admin credentials created directly in Supabase Dashboard.
