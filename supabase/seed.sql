-- ==============================================================================
-- SEED DATA SISTEM INFORMASI PKL
-- Perhatian: File ini DILARANG DIJALANKAN OTOMATIS OLEH AGEN AI.
-- User harus menjalankannya secara manual di Supabase SQL Editor.
-- ==============================================================================

-- 1. Insert Perusahaan Default (Untuk testing radius absensi)
-- Gunakan koordinat area Magelang / SMK N 1 Magelang
INSERT INTO public.perusahaan (id, nama, alamat, lat, lng, radius_meter) 
VALUES (
    gen_random_uuid(), 
    'PT. Antigravity Indonesia (Test Area)', 
    'Magelang, Jawa Tengah', 
    -7.472719, 110.222305, -- Ganti koordinat ini dengan lokasi tes Anda
    500
) ON CONFLICT DO NOTHING;

-- 2. Insert Periode PKL Aktif
INSERT INTO public.periode_pkl (id, nama_periode, tanggal_mulai, tanggal_selesai, is_active)
VALUES (
    gen_random_uuid(),
    'PKL Tahun Ajaran 2026/2027',
    '2026-07-01',
    '2026-12-31',
    true
) ON CONFLICT DO NOTHING;

-- Catatan:
-- Akun Admin tidak bisa di-seed dengan SQL INSERT karena Supabase Auth (auth.users)
-- memerlukan proses hashing password dan trigger. 
-- Silakan buat 1 akun admin manual lewat Supabase Dashboard (Menu Authentication -> Add User),
-- lalu update rolenya di tabel users_profile menjadi 'admin'.
