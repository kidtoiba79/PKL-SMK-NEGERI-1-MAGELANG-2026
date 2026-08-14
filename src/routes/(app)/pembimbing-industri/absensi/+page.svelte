<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';

	let loading = $state(true);
	let absensiList = $state([]);
	let filterDate = $state(new Date().toISOString().split('T')[0]);

	onMount(() => {
		fetchAbsensi();
	});

	async function fetchAbsensi() {
		if (!$auth.profile?.perusahaan_id) return;
		loading = true;

		// Ambil penempatan_id untuk perusahaan ini
		const { data: penempatanData } = await supabase
			.from('penempatan')
			.select('id, siswa(nama, kelas)')
			.eq('perusahaan_id', $auth.profile.perusahaan_id);

		if (!penempatanData || penempatanData.length === 0) {
			absensiList = [];
			loading = false;
			return;
		}

		const penempatanIds = penempatanData.map(p => p.id);
		
		// Map lookup siswa berdasarkan penempatan_id
		const siswaMap = {};
		penempatanData.forEach(p => { siswaMap[p.id] = p.siswa; });

		// Ambil data absensi pada tanggal tersebut
		const { data: absenData, error } = await supabase
			.from('absensi_pkl')
			.select('*')
			.in('penempatan_id', penempatanIds)
			.eq('tanggal', filterDate);

		if (absenData) {
			absensiList = absenData.map(a => ({
				...a,
				siswa: siswaMap[a.penempatan_id]
			}));
		} else {
			absensiList = [];
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Kehadiran Siswa | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Kehadiran Siswa</h1>
	<p>Pantau rekap absensi harian (Geotagging & Wajah) di perusahaan Anda</p>
</div>

<div class="card mb-lg">
	<div style="display: flex; gap: var(--space-md); align-items: flex-end; max-width: 300px;">
		<div class="form-group w-full">
			<label class="form-label" for="filterDate">Filter Tanggal</label>
			<input type="date" id="filterDate" bind:value={filterDate} onchange={fetchAbsensi} class="input" />
		</div>
	</div>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Nama Siswa</th>
					<th>Jam Masuk</th>
					<th>Jam Pulang</th>
					<th>Status</th>
					<th>Skor Wajah</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="5" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if absensiList.length > 0}
					{#each absensiList as item}
						<tr>
							<td>
								<strong>{item.siswa.nama}</strong><br/>
								<span class="text-xs text-muted">{item.siswa.kelas}</span>
							</td>
							<td>
								{#if item.jam_masuk}
									{new Date(item.jam_masuk).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
								{:else}
									-
								{/if}
							</td>
							<td>
								{#if item.jam_pulang}
									{new Date(item.jam_pulang).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
								{:else}
									-
								{/if}
							</td>
							<td><span class="badge badge-{item.status}">{item.status}</span></td>
							<td>
								{#if item.face_confidence_masuk}
									<span class="text-xs">Masuk: {(item.face_confidence_masuk * 100).toFixed(0)}%</span>
								{/if}
								{#if item.face_confidence_pulang}
									<br/><span class="text-xs">Pulang: {(item.face_confidence_pulang * 100).toFixed(0)}%</span>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="text-center text-muted" style="padding: var(--space-xl) 0;">
							Tidak ada data absensi pada tanggal ini.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
