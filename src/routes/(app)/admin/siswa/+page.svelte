<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';

	let siswas = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			const { data, error } = await supabase
				.from('siswa')
				.select('*')
				.order('kelas')
				.order('nama');
			if (data) siswas = data;
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>Data Siswa | SiPKL Admin</title>
</svelte:head>

<div class="page-header">
	<h1>Master Data Siswa</h1>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>NIS</th>
					<th>Nama Siswa</th>
					<th>Kelas</th>
					<th>Jurusan</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="4" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if siswas.length > 0}
					{#each siswas as s}
						<tr>
							<td>{s.nis}</td>
							<td><strong>{s.nama}</strong></td>
							<td>{s.kelas}</td>
							<td>{s.jurusan}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="text-center text-muted" style="padding: var(--space-xl) 0;">Data kosong.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
