<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let penempatans = $state([]);
	let loading = $state(true);
	let stats = $state({ total: 0, hariIniHadir: 0 });

	onMount(async () => {
		if ($auth.profile?.perusahaan_id) {
			const { data, error } = await supabase
				.from('penempatan')
				.select(`
					id, 
					siswa (nama, nis, kelas, jurusan),
					guru_pembimbing (nama)
				`)
				.eq('perusahaan_id', $auth.profile.perusahaan_id);
				
			if (data) {
				penempatans = data;
				stats.total = data.length;

				// Cek kehadiran hari ini
				const penempatanIds = data.map(p => p.id);
				if (penempatanIds.length > 0) {
					const today = new Date().toISOString().split('T')[0];
					const { data: absenToday } = await supabase
						.from('absensi_pkl')
						.select('id, status')
						.in('penempatan_id', penempatanIds)
						.eq('tanggal', today)
						.eq('status', 'hadir');
					
					if (absenToday) stats.hariIniHadir = absenToday.length;
				}
			}
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Dashboard DUDI | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Dashboard Pembimbing Industri</h1>
	<p>Selamat datang, {$auth.profile?.nama} ({$auth.profile?.jabatan || 'Pembimbing'})</p>
</div>

{#if loading}
	<div style="display: flex; justify-content: center; padding: var(--space-2xl);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else}
	<div class="stats-grid mb-xl">
		<div class="stat-card">
			<div class="stat-value text-accent">{stats.total}</div>
			<div class="stat-label">Siswa Ditempatkan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.hariIniHadir}</div>
			<div class="stat-label">Siswa Hadir Hari Ini</div>
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
						<th>Kelas / Jurusan</th>
						<th>Guru Pembimbing Sekolah</th>
					</tr>
				</thead>
				<tbody>
					{#if penempatans.length > 0}
						{#each penempatans as p}
							<tr>
								<td>{p.siswa.nis}</td>
								<td><strong>{p.siswa.nama}</strong></td>
								<td>{p.siswa.kelas} - {p.siswa.jurusan}</td>
								<td>{p.guru_pembimbing?.nama || '-'}</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="4" class="text-center text-muted" style="padding: var(--space-xl) 0;">
								Belum ada siswa yang ditempatkan di perusahaan ini.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{/if}
