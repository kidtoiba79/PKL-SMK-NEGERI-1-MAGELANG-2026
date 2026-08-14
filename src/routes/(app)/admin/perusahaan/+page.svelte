<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let perusahaans = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			const { data } = await supabase.from('perusahaan').select('*').order('nama');
			if (data) perusahaans = data;
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Data Perusahaan | SiPKL Admin</title>
</svelte:head>

<div class="page-header">
	<h1>Master Data Perusahaan</h1>
	<p>Daftar titik lokasi DUDI (Dunia Usaha Dunia Industri) untuk Geotagging</p>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Nama Perusahaan</th>
					<th>Alamat</th>
					<th>Radius Absensi</th>
					<th>Titik Koordinat (Lat, Lng)</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="4" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if perusahaans.length > 0}
					{#each perusahaans as p}
						<tr>
							<td><strong>{p.nama}</strong></td>
							<td>{p.alamat}</td>
							<td>{p.radius_meter} meter</td>
							<td>
								<code class="text-xs">{p.lat}, {p.lng}</code>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="text-center text-muted" style="padding: var(--space-xl) 0;">Data perusahaan kosong.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
