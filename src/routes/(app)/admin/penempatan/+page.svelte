<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let penempatans = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			const { data } = await supabase
				.from('penempatan')
				.select(`
					id, 
					siswa (nama, nis, kelas),
					perusahaan (nama),
					guru_pembimbing (nama),
					pembimbing_industri (nama),
					periode_pkl (nama_periode)
				`);
			if (data) penempatans = data;
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Data Penempatan | SiPKL Admin</title>
</svelte:head>

<div class="page-header">
	<h1>Plotting Penempatan PKL</h1>
	<p>Daftar relasi antara Siswa, DUDI, Guru Pembimbing, dan Pembimbing Industri.</p>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Periode</th>
					<th>Siswa</th>
					<th>Perusahaan (DUDI)</th>
					<th>Guru Sekolah</th>
					<th>Pembimbing Industri</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="5" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if penempatans.length > 0}
					{#each penempatans as p}
						<tr>
							<td><span class="badge badge-tosca">{p.periode_pkl.nama_periode}</span></td>
							<td><strong>{p.siswa.nama}</strong><br/><span class="text-xs text-muted">{p.siswa.kelas}</span></td>
							<td>{p.perusahaan.nama}</td>
							<td>{p.guru_pembimbing?.nama || '-'}</td>
							<td>{p.pembimbing_industri?.nama || '-'}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="text-center text-muted" style="padding: var(--space-xl) 0;">Belum ada data penempatan.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
