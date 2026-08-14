# Project Memory & Documentation (SiPKL SMK N 1 Magelang)

## 1. Project Identity
- **Name**: Sistem Informasi PKL (SiPKL) SMK Negeri 1 Magelang
- **Stack**: SvelteKit (Vite), Supabase (PostgreSQL + Storage), Vanilla CSS
- **Design Philosophy**: Luxury, Editorial, Modern (Color Palette: Biru Tosca/Sky Blue `#0ea5e9`, Dark Surface `#1e293b`).
- **Core Features**: Geofenced Attendance (500m radius), Face Recognition (Liveness/Smile check) using `face-api.js`, Daily Journals, PDF Report generation, and 4-tier Role Management (Siswa, Guru, DUDI/Perusahaan, Admin).
- **GitHub Repository**: `https://github.com/kidtoiba79/PKL-SMK-NEGERI-1-MAGELANG-2026.git`

## 2. Supabase Infrastructure
- **Project URL**: `https://zsrhkdnumrifnjrqjljr.supabase.co`
- **Database Rules (RLS)**: Row Level Security is active for all 11 tables.
- **Storage**: Requires a public bucket named `berkas_pkl` (For student PDF reports).
- **Authentication**: `auth.users` automatically syncs to `public.users_profile` via Postgres Trigger (`handle_new_user`).

## 3. Database Schema (11 Tables)
1. `users_profile`: Extends Auth. Contains `role` (admin, siswa, guru, dudi) and `nama`.
2. `perusahaan`: Master DUDI. Holds geofence data (`lat`, `lng`, `radius_meter`).
3. `siswa`: Master student data (`nis`, `kelas`, `jurusan`).
4. `guru_pembimbing`: Master teacher data (`nip`).
5. `pembimbing_industri`: Master DUDI mentor data.
6. `periode_pkl`: Active period management.
7. `penempatan`: Pivot table connecting Student <-> Company <-> Teacher <-> DUDI <-> Period.
8. `absensi_pkl`: Logs check-in/out timestamps, coordinates, and face recognition confidence score.
9. `jurnal_kegiatan`: Daily logs by students. Validated by DUDI.
10. `laporan_akhir`: PDF submission by students. Graded by Teacher.
11. `face_profiles`: JSONB descriptors for student face biometrics (no images stored).

## 4. Key AI / Logic Workflows
- **Face Recognition**: Handled locally on the client using `face-api.js` (weights loaded from `/static/face-api/model`). 
  - *Registration (Admin)*: Extracts numerical descriptors and saves them to `face_profiles`.
  - *Attendance (Siswa)*: Captures frame, extracts descriptor, calculates Euclidean distance against saved profile. Checks for a "smile" expression for liveness verification.
- **Geofencing**: Uses Haversine formula (`src/lib/utils/haversine.js`) to ensure student is within company radius before allowing check-in.
- **Time Validation**: Enforces check-in (06:00 - 09:00) and check-out (14:00 - 18:00) via `src/lib/utils/timeValidator.js`.

## 5. File Structure Highlights
- `/src/routes/(app)/`: Authenticated layouts and dashboards.
  - `/admin`: Master data CRUD and Face Registration.
  - `/siswa`: Attendance, Journal entry, Report upload.
  - `/guru`: Journal monitoring, Report grading.
  - `/pembimbing-industri`: Attendance monitoring, Journal approval.
- `/src/lib/stores/auth.js`: Global state for the logged-in user profile.
- `/src/lib/components/`: Reusable UI (Button, Card, Sidebar, Modal, FaceCamera, InstallPrompt).
- `/static/sw.js` & `manifest.json`: Progressive Web App (PWA) configuration.

## 6. How to Run Locally
1. Run `start_sipkl.bat` (Executing `npm run dev -- --open`).
2. Login with Admin credentials created directly in Supabase Dashboard.

## 7. Future Maintenance / Todos
- Setup PDF Generation for Attendance Summary (Rekap Excel/PDF).
- Implement deeper RLS policies if more strict data isolation between companies/teachers is required.
