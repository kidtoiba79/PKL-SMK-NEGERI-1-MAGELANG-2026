# SiPKL — Sistem Informasi PKL SMK N 1 Magelang

Sistem Informasi Praktik Kerja Lapangan (PKL) terpadu yang dilengkapi dengan fitur **Geotagging** dan **Face Recognition** untuk validasi absensi (anti-fake GPS & anti-titip absen). Dibangun menggunakan **SvelteKit** & **Supabase**.

---

## 💻 Cara Menjalankan Aplikasi

### Pertama Kali (Install Dependencies)
```bash
npm install
```

### Setiap Hari (Jalankan Server)
Klik 2x pada file **`start_sipkl.bat`** — server akan otomatis menyala dan browser akan terbuka.

Atau lewat terminal:
```bash
npm run dev
```

> Pastikan file `.env.local` sudah berisi kredensial Supabase Anda sebelum menjalankan.

---

## 🔑 Panduan Login & Akun

### 1. Login Admin (Pertama Kali Setup)

Akun Admin harus dibuat secara manual lewat Supabase Dashboard karena sistem menggunakan enkripsi password bawaan Supabase.

**Langkah-langkah:**
1. Buka **Supabase Dashboard** → Menu **Authentication** → klik **"Add User"**
2. Masukkan **Email** dan **Password** Admin, centang *Auto Confirm User*
3. Setelah user terbuat, buka **Table Editor** → tabel `users_profile`
4. Cari baris dengan email tersebut, ubah nilai kolom **`role`** dari `siswa` menjadi **`admin`**
5. Login ke aplikasi menggunakan email & password tersebut → otomatis masuk ke Dashboard Admin

---

### 2. Login Siswa

Siswa menggunakan **Email Virtual berbasis NIS** — tidak perlu mendaftar sendiri.

| Field | Format |
|---|---|
| **Email** | `[NIS]@siswa.smkn1magelang.sch.id` |
| **Password** | `Siswa123!` (default, bisa diubah) |

**Contoh:** Siswa dengan NIS `12345` → login dengan email `12345@siswa.smkn1magelang.sch.id`

> Akun siswa dibuat otomatis oleh Admin menggunakan tombol **"🔑 Generate Akun Siswa"** di halaman Master Data Siswa (setelah data diimport dari Excel).

---

## 📊 Panduan Import Data Siswa dari Excel

### Langkah 1 — Persiapan Database (Hanya Sekali)
Sebelum pertama kali menggunakan fitur import, jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- Tambah kolom baru di tabel siswa (jika belum ada)
ALTER TABLE public.siswa
ADD COLUMN IF NOT EXISTS nama_orang_tua VARCHAR(255),
ADD COLUMN IF NOT EXISTS no_telp VARCHAR(50),
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(10),
ADD COLUMN IF NOT EXISTS alamat TEXT;

-- Tambah kolom no_telp untuk pembimbing industri
ALTER TABLE public.pembimbing_industri
ADD COLUMN IF NOT EXISTS no_telp VARCHAR(50);
```

### Langkah 2 — Download Template Excel
1. Login sebagai **Admin**
2. Buka menu **"Master Data Siswa"** di sidebar
3. Klik tombol **"📄 Download Template"**
4. Buka file `template_siswa_lengkap.xlsx` yang terunduh

### Langkah 3 — Isi Data di Excel

Template Excel memiliki kolom-kolom berikut:

| Kolom | Keterangan | Wajib? |
|---|---|---|
| **NIS** | Nomor Induk Siswa | ✅ **WAJIB** |
| **Nama Lengkap** | Nama lengkap siswa | ✅ **WAJIB** |
| Kelas | Contoh: `XI RPL 1` | Opsional |
| Jurusan | Contoh: `Rekayasa Perangkat Lunak` | Opsional |
| Jenis Kelamin | Isi `L` atau `P` | Opsional |
| Alamat | Alamat rumah siswa | Opsional |
| Nama Orang Tua | Nama orang tua / wali | Opsional |
| No Telp | No HP orang tua siswa | Opsional |
| **Tempat PKL** | Nama perusahaan tempat PKL | Opsional |
| Alamat PKL | Alamat perusahaan | Opsional |
| **Nama Pembimbing Industri** | Pembimbing dari perusahaan (DUDI) | Opsional |
| No Telp Pembimbing | No HP pembimbing industri | Opsional |
| **Nama Guru Pembimbing** | Nama guru pembimbing dari sekolah | Opsional |

> 💡 **Tips:** Kolom yang Opsional bisa dikosongkan. Hanya NIS dan Nama Lengkap yang wajib diisi.

### Langkah 4 — Import Data ke Sistem
1. Kembali ke halaman **"Master Data Siswa"**
2. Klik tombol **"⬆️ Import Excel"**
3. Pilih file Excel yang sudah Anda isi
4. Tunggu proses import selesai — sistem akan otomatis:
   - Menyimpan biodata siswa
   - Membuat data Perusahaan (jika belum ada di database)
   - Membuat data Pembimbing Industri (jika belum ada)
   - Mencari/menautkan Guru Pembimbing yang sudah terdaftar
   - Membuat Penempatan PKL secara otomatis
5. Toast notifikasi **"Import selesai!"** akan muncul saat selesai

### Langkah 5 — Generate Akun Login Siswa
Setelah data siswa berhasil diimport:
1. Klik tombol **"🔑 Generate Akun Siswa"** (tombol ungu)
2. Sistem akan membuat akun login untuk semua siswa yang belum memiliki akun
3. Setelah sukses, sampaikan kepada siswa untuk login menggunakan format email di atas

### Langkah 6 — Export Data
Untuk mengunduh seluruh data siswa beserta informasi PKL dan email login:
- Klik tombol **"⬇️ Export Excel"**
- File `data_siswa_dan_pkl.xlsx` akan terunduh, berisi semua kolom termasuk Email Login, Tempat PKL, Pembimbing Industri, dan Guru Pembimbing

---

## 🗂 Struktur Role & Akses

| Role | Akses |
|---|---|
| **Admin** | Kelola semua master data, registrasi wajah, generate akun |
| **Siswa** | Absensi mandiri (wajah + GPS), jurnal harian, upload laporan |
| **Guru** | Monitoring absensi & jurnal siswa bimbingan, nilai laporan |
| **DUDI** | Approve/reject jurnal harian siswa |

---

## 🚀 Fase Pengembangan (Roadmap)

| Fase | Fitur | Status |
|---|---|---|
| FASE 0 | Project Initialization | ✅ Selesai |
| FASE 1 | Design System & Global Styles | ✅ Selesai |
| FASE 2 | Database Schema (11 tabel) | ✅ Selesai |
| FASE 3 | Supabase Client & Auth Store | ✅ Selesai |
| FASE 4 | Utilities & Face API | ✅ Selesai |
| FASE 5 | Routing & Layout | ✅ Selesai |
| FASE 6 | Modul Absensi Siswa (Face + GPS) | ✅ Selesai |
| FASE 7 | Modul Jurnal & Laporan Siswa | ✅ Selesai |
| FASE 8 | Modul Validasi Pembimbing Industri | ✅ Selesai |
| FASE 9 | Modul Monitoring Guru | ✅ Selesai |
| FASE 10 | Modul Admin & Registrasi Wajah | ✅ Selesai |
| FASE 11 | PWA (Progressive Web App) | ✅ Selesai |
| TAMBAHAN | Import/Export Excel + Generate Akun | ✅ Selesai |

