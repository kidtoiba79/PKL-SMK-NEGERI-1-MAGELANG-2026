<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { exportJournalPDF } from '$lib/exportHelper.js';

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

		// Ambil jurnal pada tanggal filter
		const { data: jurnalData, error } = await supabase
			.from('jurnal_kegiatan')
			.select('*')
			.in('penempatan_id', penempatanIds)
			.eq('tanggal', filterDate);

		if (jurnalData) {
			jurnals = jurnalData.map(j => ({
				...j,
				siswa: penempatanMap[j.penempatan_id]?.siswa || {},
				perusahaan: penempatanMap[j.penempatan_id]?.perusahaan || {}
			}));
		} else {
			jurnals = [];
		}

		loading = false;
	}

	function handleExportJournalPDF() {
		if (jurnals.length === 0) {
			toast.info('Tidak ada jurnal pada tanggal ini untuk diekspor.');
			return;
		}

		exportJournalPDF({
			title: 'REKAPITULASI JURNAL HARIAN SISWA BIMBINGAN PKL',
			subtitle: `SMK Negeri 1 Magelang - Tanggal: ${filterDate}`,
			journals: jurnals,
			meta: {
				siswaNama: `Seluruh Siswa Bimbingan (${$auth.profile?.nama})`,
				perusahaanNama: 'Multi-DUDI'
			},
			filename: `rekap_jurnal_${filterDate}.pdf`
		});

		toast.success('File PDF Jurnal berhasil diunduh!');
	}
</script>

<svelte:head>
	<title>Monitoring Siswa | SiPKL</title>
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
	<div>
		<h1>Monitoring Jurnal Siswa</h1>
		<p>Pantau kegiatan harian siswa bimbingan Anda beserta status persetujuan dari DUDI.</p>
	</div>
	{#if jurnals.length > 0}
		<Button variant="secondary" size="sm" onclick={handleExportJournalPDF}>
			<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
			</svg>
			Cetak PDF Jurnal Tanggal Ini
		</Button>
	{/if}
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
	{#if loading}
		<Skeleton variant="table" rows={4} />
	{:else}
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
					{#if jurnals.length > 0}
						{#each jurnals as j}
							<tr>
								<td>
									<strong>{j.siswa.nama}</strong><br/>
									<span class="text-xs text-muted">{j.perusahaan?.nama} ({j.siswa?.kelas})</span>
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
	{/if}
</div>
