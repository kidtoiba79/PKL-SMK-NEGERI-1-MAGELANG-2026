<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let periodes = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			const { data } = await supabase.from('periode_pkl').select('*').order('tanggal_mulai', {ascending: false});
			if (data) periodes = data;
		}
		loading = false;
	});
</script>
<div class="page-header"><h1>Periode PKL</h1></div>
<div class="card">
	<div class="table-wrapper">
		<table>
			<thead><tr><th>Nama Periode</th><th>Mulai</th><th>Selesai</th><th>Status</th></tr></thead>
			<tbody>
				{#if loading}
					<tr><td colspan="4">Memuat...</td></tr>
				{:else if periodes.length > 0}
					{#each periodes as p}
						<tr>
							<td>{p.nama_periode}</td><td>{p.tanggal_mulai}</td><td>{p.tanggal_selesai}</td>
							<td><span class="badge {p.is_active ? 'badge-hadir' : 'badge-pending'}">{p.is_active ? 'Aktif' : 'Tutup'}</span></td>
						</tr>
					{/each}
				{:else}
					<tr><td colspan="4">Data kosong</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
