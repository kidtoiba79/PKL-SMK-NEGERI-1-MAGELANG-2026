import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	// Supabase Admin Client
	const supabaseAdmin = createClient(
		publicEnv.PUBLIC_SUPABASE_URL, 
		privateEnv.SUPABASE_SERVICE_ROLE_KEY, 
		{ auth: { autoRefreshToken: false, persistSession: false } }
	);

	try {
		const reqBody = await request.json().catch(() => ({}));
		const type = reqBody.type || 'siswa'; // default 'siswa'

		let targetTable = type === 'guru' ? 'guru_pembimbing' : 'siswa';
		let emailDomain = type === 'guru' ? 'guru.smkn1magelang.sch.id' : 'siswa.smkn1magelang.sch.id';
		let defaultPassword = type === 'guru' ? 'Guru123!' : 'Siswa123!';
		let targetRole = type === 'guru' ? 'guru' : 'siswa';

		// 1. Ambil semua data target yang belum punya akun login
		const { data: targets, error: fetchError } = await supabaseAdmin
			.from(targetTable)
			.select(type === 'guru' ? 'id, nip, nama' : 'id, nis, nama')
			.is('user_id', null);

		if (fetchError) throw fetchError;

		if (!targets || targets.length === 0) {
			return json({ success: true, message: `Semua ${type} sudah memiliki akun.`, count: 0 });
		}

		let sukses = 0;
		let gagal = 0;
		const errors = [];

		// 2. Loop dan buat akun via Admin API resmi
		for (const target of targets) {
			const identifier = type === 'guru' ? target.nip : target.nis;
			if (!identifier) {
				gagal++;
				errors.push(`ID: ${target.id} tidak memiliki identifier (NIP/NIS)`);
				continue;
			}
			
			const email = `${identifier}@${emailDomain}`;
			
			const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
				email: email,
				password: defaultPassword,
				email_confirm: true,
				user_metadata: { nama: target.nama }
			});

			if (createError) {
				if (createError.message.includes('already registered')) {
					const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
					const existingUser = users.find(u => u.email === email);
					if (existingUser) {
						await supabaseAdmin.from(targetTable).update({ user_id: existingUser.id }).eq('id', target.id);
						sukses++;
					}
				} else {
					gagal++;
					errors.push(`${identifier}: ${createError.message}`);
				}
				continue;
			}

			// 3. Update user_id di tabel target
			await supabaseAdmin
				.from(targetTable)
				.update({ user_id: newUser.user.id })
				.eq('id', target.id);

			// 4. Update role di users_profile (trigger seharusnya auto-create, ini untuk jaga-jaga/overwrite role)
			await supabaseAdmin
				.from('users_profile')
				.upsert({ id: newUser.user.id, role: targetRole, nama: target.nama }, { onConflict: 'id' });

			sukses++;
		}

		return json({
			success: true,
			message: `${sukses} akun ${type} berhasil dibuat. ${gagal} gagal.`,
			count: sukses,
			errors: errors.length > 0 ? errors : undefined
		});

	} catch (error) {
		console.error('Generate accounts error:', error);
		return json({ success: false, message: error.message }, { status: 500 });
	}
}
