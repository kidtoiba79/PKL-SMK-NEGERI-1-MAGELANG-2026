<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let loading = $state(true);
	let jurnals = $state([]);
	let filterDate = $state(new Date().toISOString().split('T')[0]);

	onMount(() => {
		fetchJurnals();
	});

	async function fetchJurnals() {
		if (!$auth.profile?.guru_id) return;
		loading = true;

		// Ambil penempatan_id untuk guru ini
		const { data: penempatanData } = await supabase
			.from('penempatan')
			.select('id, siswa(nama, kelas), perusahaan(nama)')
			.eq('guru_id', $auth.profile.guru_id);

		if (!penempatanData || penempatanData.length === 0) {
			jurnals = [];
			loading = false;
			return;
		}

		const penempatanIds = penempatanData.map(p => p.id);
		const penempatanMap = {};
		penempatanData.forEach(p => { penempatanMap[p.id] = p; });

		// Ambil jurnal pada tanggal filter (untuk memonitor harian siswa)
		// Guru hanya monitoring, jadi hanya melihat jurnal (termasuk status validasi DUDI)
		const { data: jurnalData, error } = await supabase
			.from('jurnal_kegiatan')
			.select('*')
			.in('penempatan_id', penempatanIds)
			.eq('tanggal', filterDate);

		if (jurnalData) {
			jurnals = jurnalData.map(j => ({
				...j,
				siswa: penempatanMap[j.penempatan_id].siswa,
				perusahaan: penempatanMap[j.penempatan_id].perusahaan
			}));
		} else {
			jurnals = [];
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Monitoring Siswa | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Monitoring Jurnal Siswa</h1>
	<p>Pantau kegiatan harian siswa bimbingan Anda beserta status persetujuan dari DUDI.</p>
</div>

<div class="card mb-lg">
	<div style="display: flex; gap: var(--space-md); align-items: flex-end; max-width: 300px;">
		<div class="form-group w-full">
			<label class="form-label" for="filterDate">Filter Tanggal Kegiatan</label>
			<input type="date" id="filterDate" bind:value={filterDate} onchange={fetchJurnals} class="input" />
		</div>
	</div>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Siswa & DUDI</th>
					<th style="width: 50%;">Aktivitas Harian</th>
					<th>Status (Validasi DUDI)</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="3" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if jurnals.length > 0}
					{#each jurnals as j}
						<tr>
							<td>
								<strong>{j.siswa.nama}</strong><br/>
								<span class="text-xs text-muted">{j.perusahaan?.nama}</span>
							</td>
							<td><div style="white-space: pre-wrap; font-size: 0.8rem;">{j.deskripsi}</div></td>
							<td>
								<span class="badge badge-{j.status_approval}">{j.status_approval}</span>
								{#if j.status_approval === 'reject'}
									<br/><span class="text-xs text-muted">Revisi: {j.catatan_revisi}</span>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="3" class="text-center text-muted" style="padding: var(--space-xl) 0;">
							Tidak ada jurnal siswa pada tanggal ini.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
