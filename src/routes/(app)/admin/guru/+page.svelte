<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let gurus = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			const { data } = await supabase.from('guru_pembimbing').select('*').order('nama');
			if (data) gurus = data;
		}
		loading = false;
	});
</script>
<div class="page-header"><h1>Data Guru Pembimbing</h1></div>
<div class="card">
	<div class="table-wrapper">
		<table>
			<thead><tr><th>NIP</th><th>Nama Guru</th></tr></thead>
			<tbody>
				{#if loading}
					<tr><td colspan="2">Memuat...</td></tr>
				{:else if gurus.length > 0}
					{#each gurus as g}<tr><td>{g.nip || '-'}</td><td>{g.nama}</td></tr>{/each}
				{:else}
					<tr><td colspan="2">Data kosong</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
