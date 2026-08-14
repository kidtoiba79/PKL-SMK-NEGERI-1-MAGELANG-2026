<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let penempatans = $state([]);
	let loading = $state(true);
	let stats = $state({ totalSiswa: 0, totalPerusahaan: 0 });

	onMount(async () => {
		if ($auth.profile?.guru_id) {
			const { data, error } = await supabase
				.from('penempatan')
				.select(`
					id, 
					siswa (nama, nis, kelas, jurusan),
					perusahaan (nama, alamat),
					pembimbing_industri (nama)
				`)
				.eq('guru_id', $auth.profile.guru_id);
				
			if (data) {
				penempatans = data;
				stats.totalSiswa = data.length;
				const uniqueDudi = new Set(data.map(p => p.perusahaan?.nama));
				stats.totalPerusahaan = uniqueDudi.size;
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
	<div class="stats-grid mb-xl">
		<div class="stat-card">
			<div class="stat-value text-accent">{stats.totalSiswa}</div>
			<div class="stat-label">Siswa Bimbingan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.totalPerusahaan}</div>
			<div class="stat-label">Titik Perusahaan</div>
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
						<th>Perusahaan DUDI</th>
						<th>Pembimbing Industri</th>
					</tr>
				</thead>
				<tbody>
					{#if penempatans.length > 0}
						{#each penempatans as p}
							<tr>
								<td>{p.siswa.nis}</td>
								<td><strong>{p.siswa.nama}</strong></td>
								<td>{p.siswa.kelas}</td>
								<td>{p.perusahaan?.nama || '-'}</td>
								<td>{p.pembimbing_industri?.nama || '-'}</td>
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
