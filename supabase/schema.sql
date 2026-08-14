-- ==============================================================================
-- SCHEMA SISTEM INFORMASI PKL (SvelteKit + Supabase)
-- Idempotent script: aman dijalankan berkali-kali tanpa error "already exists"
-- ==============================================================================

-- 1. EXTENDED USER PROFILE (Auto-sync dari auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'siswa', 'guru', 'dudi')),
    nama VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MASTER PERUSAHAAN (DUDI)
CREATE TABLE IF NOT EXISTS public.perusahaan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    radius_meter INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MASTER SISWA
CREATE TABLE IF NOT EXISTS public.siswa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users_profile(id) ON DELETE SET NULL,
    nis VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    kelas VARCHAR(100) NOT NULL,
    jurusan VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MASTER GURU PEMBIMBING
CREATE TABLE IF NOT EXISTS public.guru_pembimbing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users_profile(id) ON DELETE SET NULL,
    nip VARCHAR(50) UNIQUE,
    nama VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MASTER PEMBIMBING INDUSTRI (DUDI)
CREATE TABLE IF NOT EXISTS public.pembimbing_industri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users_profile(id) ON DELETE SET NULL,
    perusahaan_id UUID NOT NULL REFERENCES public.perusahaan(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PERIODE PKL
CREATE TABLE IF NOT EXISTS public.periode_pkl (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_periode VARCHAR(255) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PENEMPATAN PKL (Pivot table untuk relasi)
CREATE TABLE IF NOT EXISTS public.penempatan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    perusahaan_id UUID NOT NULL REFERENCES public.perusahaan(id) ON DELETE CASCADE,
    guru_id UUID REFERENCES public.guru_pembimbing(id) ON DELETE SET NULL,
    dudi_id UUID REFERENCES public.pembimbing_industri(id) ON DELETE SET NULL,
    periode_id UUID NOT NULL REFERENCES public.periode_pkl(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, periode_id)
);

-- 8. ABSENSI PKL (Geotagging + Face Recognition + Izin/Sakit)
CREATE TABLE IF NOT EXISTS public.absensi_pkl (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    penempatan_id UUID NOT NULL REFERENCES public.penempatan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam_masuk TIMESTAMPTZ,
    jam_pulang TIMESTAMPTZ,
    lat_masuk DECIMAL(10, 8),
    lng_masuk DECIMAL(11, 8),
    lat_pulang DECIMAL(10, 8),
    lng_pulang DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
    keterangan_izin TEXT,
    surat_izin_url TEXT,
    face_confidence_masuk DECIMAL(5, 4),
    face_confidence_pulang DECIMAL(5, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(penempatan_id, tanggal)
);

-- Migration Helper jika tabel absensi_pkl sudah ada sebelumnya
ALTER TABLE public.absensi_pkl ADD COLUMN IF NOT EXISTS keterangan_izin TEXT;
ALTER TABLE public.absensi_pkl ADD COLUMN IF NOT EXISTS surat_izin_url TEXT;

-- 9. JURNAL KEGIATAN HARIAN
CREATE TABLE IF NOT EXISTS public.jurnal_kegiatan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    penempatan_id UUID NOT NULL REFERENCES public.penempatan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    deskripsi TEXT NOT NULL,
    foto_url TEXT[],
    status_approval VARCHAR(50) DEFAULT 'pending' CHECK (status_approval IN ('pending', 'approve', 'reject')),
    catatan_revisi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LAPORAN AKHIR PKL (PDF)
CREATE TABLE IF NOT EXISTS public.laporan_akhir (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    penempatan_id UUID UNIQUE NOT NULL REFERENCES public.penempatan(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approve', 'reject')),
    nilai_angka INTEGER CHECK (nilai_angka >= 0 AND nilai_angka <= 100),
    catatan_guru TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FACE PROFILES
CREATE TABLE IF NOT EXISTS public.face_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    role_hint VARCHAR(50) DEFAULT 'siswa',
    reference_id UUID,
    descriptors JSONB[] NOT NULL,
    sample_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ==============================================================================

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perusahaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_pembimbing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembimbing_industri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periode_pkl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penempatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_pkl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_akhir ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies if already exist sebelum membuat ulang
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users_profile;
CREATE POLICY "Allow all for authenticated users" ON public.users_profile FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.perusahaan;
CREATE POLICY "Allow all for authenticated users" ON public.perusahaan FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.siswa;
CREATE POLICY "Allow all for authenticated users" ON public.siswa FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.guru_pembimbing;
CREATE POLICY "Allow all for authenticated users" ON public.guru_pembimbing FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.pembimbing_industri;
CREATE POLICY "Allow all for authenticated users" ON public.pembimbing_industri FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.periode_pkl;
CREATE POLICY "Allow all for authenticated users" ON public.periode_pkl FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.penempatan;
CREATE POLICY "Allow all for authenticated users" ON public.penempatan FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.absensi_pkl;
CREATE POLICY "Allow all for authenticated users" ON public.absensi_pkl FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.jurnal_kegiatan;
CREATE POLICY "Allow all for authenticated users" ON public.jurnal_kegiatan FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.laporan_akhir;
CREATE POLICY "Allow all for authenticated users" ON public.laporan_akhir FOR ALL USING (auth.role() = 'authenticated');

-- FACE PROFILES Policies
DROP POLICY IF EXISTS "Allow anon select face_profiles" ON public.face_profiles;
CREATE POLICY "Allow anon select face_profiles" ON public.face_profiles FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated full access face_profiles" ON public.face_profiles;
CREATE POLICY "Allow authenticated full access face_profiles" ON public.face_profiles FOR ALL USING (auth.role() = 'authenticated');
