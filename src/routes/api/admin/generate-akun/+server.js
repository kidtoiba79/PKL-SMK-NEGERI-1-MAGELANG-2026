import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	// Supabase Admin Client (diinisialisasi di dalam fungsi agar dynamic env terbaca saat runtime)
	const supabaseAdmin = createClient(
		publicEnv.PUBLIC_SUPABASE_URL, 
		privateEnv.SUPABASE_SERVICE_ROLE_KEY, 
		{ auth: { autoRefreshToken: false, persistSession: false } }
	);

	try {
		// 1. Ambil semua siswa yang belum punya akun login
		const { data: siswas, error: fetchError } = await supabaseAdmin
			.from('siswa')
			.select('id, nis, nama')
			.is('user_id', null);

		if (fetchError) throw fetchError;

		if (!siswas || siswas.length === 0) {
			return json({ success: true, message: 'Semua siswa sudah memiliki akun.', count: 0 });
		}

		let sukses = 0;
		let gagal = 0;
		const errors = [];

		// 2. Loop dan buat akun via Admin API resmi
		for (const siswa of siswas) {
			const email = `${siswa.nis}@siswa.smkn1magelang.sch.id`;
			
			const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email: email,
				password: 'Siswa123!',
				email_confirm: true, // Auto-confirm email, tidak perlu verifikasi
				user_metadata: { nama: siswa.nama }
			});

			if (createError) {
				// Jika email sudah ada, coba fetch user-nya
				if (createError.message.includes('already registered')) {
					const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
					const existingUser = users.find(u => u.email === email);
					if (existingUser) {
						await supabaseAdmin.from('siswa').update({ user_id: existingUser.id }).eq('id', siswa.id);
						sukses++;
					}
				} else {
					gagal++;
					errors.push(`${siswa.nis}: ${createError.message}`);
				}
				continue;
			}

			// 3. Update user_id di tabel siswa
			// Catatan: trigger handle_new_user otomatis membuat users_profile dengan role 'siswa'
			await supabaseAdmin
				.from('siswa')
				.update({ user_id: newUser.user.id })
				.eq('id', siswa.id);

			// 4. Update role di users_profile menjadi 'siswa' (pastikan trigger sudah benar)
			await supabaseAdmin
				.from('users_profile')
				.upsert({ id: newUser.user.id, role: 'siswa', nama: siswa.nama }, { onConflict: 'id' });

			sukses++;
		}

		return json({
			success: true,
			message: `${sukses} akun berhasil dibuat. ${gagal} gagal.`,
			count: sukses,
			errors: errors.length > 0 ? errors : undefined
		});

	} catch (error) {
		console.error('Generate accounts error:', error);
		return json({ success: false, message: error.message }, { status: 500 });
	}
}
