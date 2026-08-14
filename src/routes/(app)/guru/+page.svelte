<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let penempatans = $state([]);
	let absensiMap = $state({}); // Menyimpan status absen hari ini by siswa_id
	let loading = $state(true);
	let stats = $state({ totalSiswa: 0, totalPerusahaan: 0, hadir: 0, belum: 0, izin: 0, sakit: 0, alpa: 0 });

	onMount(async () => {
		if ($auth.profile?.guru_id) {
			const queryPenempatan = supabase
				.from('penempatan')
				.select(`
					id, 
					siswa (id, nama, nis, kelas, jurusan),
					perusahaan (nama, alamat),
					pembimbing_industri (nama)
				`)
				.eq('guru_id', $auth.profile.guru_id);
				
			const today = new Date().toISOString().split('T')[0];
			const queryAbsen = supabase
				.from('absensi_pkl')
				.select('siswa_id, status')
				.gte('waktu', `${today}T00:00:00Z`)
				.lte('waktu', `${today}T23:59:59Z`);

			const [resPenempatan, resAbsen] = await Promise.all([queryPenempatan, queryAbsen]);

			if (resPenempatan.data) {
				penempatans = resPenempatan.data;
				stats.totalSiswa = penempatans.length;
				const uniqueDudi = new Set(penempatans.map(p => p.perusahaan?.nama));
				stats.totalPerusahaan = uniqueDudi.size;

				// Buat map absen dan hitung stat absen
				if (resAbsen.data) {
					let h = 0, i = 0, s = 0, a = 0;
					resAbsen.data.forEach(absen => {
						// Jika absen > 1 kali hari ini (masuk/pulang), ambil yang terakhir atau cukup ambil status
						absensiMap[absen.siswa_id] = absen.status;
						if (absen.status === 'Hadir') h++;
						else if (absen.status === 'Izin') i++;
						else if (absen.status === 'Sakit') s++;
						else if (absen.status === 'Alpa') a++;
					});
					stats.hadir = h;
					stats.izin = i;
					stats.sakit = s;
					stats.alpa = a;
					stats.belum = stats.totalSiswa - (h + i + s + a);
				}
			}
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Dashboard Guru | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Dashboard Guru Pembimbing</h1>
	<p>Selamat datang, {$auth.profile?.nama}</p>
</div>

{#if loading}
	<div style="display: flex; justify-content: center; padding: var(--space-2xl);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else}
	<div class="stats-grid mb-xl" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
		<div class="stat-card">
			<div class="stat-value text-accent">{stats.totalSiswa}</div>
			<div class="stat-label">Total Siswa Bimbingan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.totalPerusahaan}</div>
			<div class="stat-label">Titik Perusahaan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-hadir);">{stats.hadir}</div>
			<div class="stat-label">Hadir Hari Ini</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-pending);">{stats.belum}</div>
			<div class="stat-label">Belum Absen</div>
		</div>
	</div>

	<div class="card">
		<h3 style="margin-bottom: var(--space-md);">Daftar Siswa Bimbingan</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>NIS</th>
						<th>Nama Siswa</th>
						<th>Kelas</th>
						<th>Tempat PKL</th>
						<th>Status Absen (Hari Ini)</th>
					</tr>
				</thead>
				<tbody>
					{#if penempatans.length > 0}
						{#each penempatans as p}
							<tr>
								<td>{p.siswa.nis}</td>
								<td><strong>{p.siswa.nama}</strong></td>
								<td>{p.siswa.kelas}</td>
								<td>
									{p.perusahaan?.nama || '-'}<br/>
									<small class="text-muted">{p.pembimbing_industri?.nama || 'Tanpa Pemb. DUDI'}</small>
								</td>
								<td>
									{#if absensiMap[p.siswa.id] === 'Hadir'}
										<span class="badge badge-success">Hadir</span>
									{:else if absensiMap[p.siswa.id] === 'Izin'}
										<span class="badge badge-warning" style="background: var(--color-izin);">Izin</span>
									{:else if absensiMap[p.siswa.id] === 'Sakit'}
										<span class="badge badge-warning" style="background: var(--color-sakit);">Sakit</span>
									{:else if absensiMap[p.siswa.id] === 'Alpa'}
										<span class="badge badge-danger">Alpa</span>
									{:else}
										<span class="badge badge-secondary">Belum Absen</span>
									{/if}
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="5" class="text-center text-muted" style="padding: var(--space-xl) 0;">
								Anda belum memiliki siswa bimbingan.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{/if}
