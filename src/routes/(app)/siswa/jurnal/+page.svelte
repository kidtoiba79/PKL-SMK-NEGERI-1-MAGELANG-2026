<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { penempatan } from '$lib/stores/penempatan.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { exportJournalPDF } from '$lib/exportHelper.js';

	let jurnals = $state([]);
	let loading = $state(true);
	
	let formTanggal = $state(new Date().toISOString().split('T')[0]);
	let formDeskripsi = $state('');
	let isSubmitting = $state(false);

	// Offline Draft State
	let draftSavedTime = $state('');
	let hasRestoredDraft = $state(false);

	const DRAFT_KEY = 'sipkl_jurnal_draft';

	onMount(async () => {
		// Pulihkan draft lokal jika ada
		restoreDraft();

		if (!$penempatan.data && $auth.profile?.siswa_id) {
			await penempatan.fetchSiswaPenempatan($auth.profile.siswa_id);
		}
		if ($penempatan.data) {
			fetchJurnals();
		} else {
			loading = false;
		}
	});

	function restoreDraft() {
		try {
			const saved = localStorage.getItem(DRAFT_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed.deskripsi && !formDeskripsi) {
					formDeskripsi = parsed.deskripsi;
					formTanggal = parsed.tanggal || formTanggal;
					draftSavedTime = parsed.time || 'Baru saja';
					hasRestoredDraft = true;
				}
			}
		} catch (e) {
			console.warn('Gagal membaca draft lokal', e);
		}
	}

	function handleInputDeskripsi(e) {
		formDeskripsi = e.target.value;
		saveDraft();
	}

	function saveDraft() {
		try {
			if (formDeskripsi.trim()) {
				const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
				localStorage.setItem(DRAFT_KEY, JSON.stringify({
					deskripsi: formDeskripsi,
					tanggal: formTanggal,
					time: timeStr
				}));
				draftSavedTime = timeStr;
			} else {
				localStorage.removeItem(DRAFT_KEY);
				draftSavedTime = '';
			}
		} catch (e) {}
	}

	function clearDraft() {
		try {
			localStorage.removeItem(DRAFT_KEY);
			draftSavedTime = '';
			hasRestoredDraft = false;
		} catch (e) {}
	}

	async function fetchJurnals() {
		loading = true;
		const { data, error } = await supabase
			.from('jurnal_kegiatan')
			.select('*')
			.eq('penempatan_id', $penempatan.data.id)
			.order('tanggal', { ascending: false });
			
		if (error) {
			toast.error('Gagal mengambil data jurnal.');
		} else {
			jurnals = data || [];
		}
		loading = false;
	}

	async function submitJurnal(e) {
		e.preventDefault();
		if (!formDeskripsi.trim()) {
			toast.error('Deskripsi kegiatan tidak boleh kosong.');
			return;
		}

		isSubmitting = true;
		const payload = {
			penempatan_id: $penempatan.data.id,
			tanggal: formTanggal,
			deskripsi: formDeskripsi.trim(),
			status_approval: 'pending'
		};

		const { error } = await supabase.from('jurnal_kegiatan').insert([payload]);
		
		if (error) {
			toast.error(error.message);
		} else {
			toast.success('Jurnal berhasil ditambahkan!');
			formDeskripsi = '';
			clearDraft();
			fetchJurnals();
		}
		isSubmitting = false;
	}

	function downloadMyJournalPDF() {
		if (jurnals.length === 0) {
			toast.info('Belum ada riwayat jurnal untuk diunduh.');
			return;
		}

		exportJournalPDF({
			title: 'JURNAL HARIAN KEGIATAN PKL SISWA',
			subtitle: 'SMK Negeri 1 Magelang - Tahun Ajaran 2025/2026',
			journals: jurnals,
			meta: {
				siswaNama: $auth.profile?.nama,
				siswaKelas: $penempatan.data?.siswa?.kelas,
				perusahaanNama: $penempatan.data?.perusahaan?.nama
			},
			filename: `jurnal_pkl_${$auth.profile?.nama?.toLowerCase().replace(/\s+/g, '_')}.pdf`
		});
		toast.success('File PDF Jurnal berhasil diunduh!');
	}
</script>

<svelte:head>
	<title>Jurnal Harian | SiPKL</title>
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
	<div>
		<h1>Jurnal Harian PKL</h1>
		<p>Catat aktivitas harian Praktik Kerja Lapangan Anda</p>
	</div>
	{#if jurnals.length > 0}
		<Button variant="secondary" size="sm" onclick={downloadMyJournalPDF}>
			<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
			</svg>
			Cetak PDF Jurnal
		</Button>
	{/if}
</div>

{#if $penempatan.data}
	<div class="card mb-xl">
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
			<h3 style="margin: 0;">Isi Jurnal Baru</h3>
			{#if draftSavedTime}
				<span class="badge badge-success" style="font-size: 0.7rem; font-weight: 500;">
					🟢 Draft tersimpan lokal ({draftSavedTime})
				</span>
			{/if}
		</div>

		{#if hasRestoredDraft}
			<div class="alert alert-info" style="margin-bottom: var(--space-md); padding: 0.5rem 0.75rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
				<span>Draft tulisan Anda sebelumnya berhasil dipulihkan otomatis.</span>
				<button class="btn btn-ghost" style="padding: 2px 6px; font-size: 0.75rem;" onclick={() => { formDeskripsi = ''; clearDraft(); }}>Hapus Draft</button>
			</div>
		{/if}

		<form onsubmit={submitJurnal}>
			<div class="form-group mb-md">
				<label class="form-label" for="tanggal">Tanggal Kegiatan</label>
				<input type="date" id="tanggal" bind:value={formTanggal} onchange={saveDraft} class="input" required max={new Date().toISOString().split('T')[0]} />
			</div>
			
			<div class="form-group mb-lg">
				<label class="form-label" for="deskripsi">Deskripsi Pekerjaan / Aktivitas</label>
				<textarea 
					id="deskripsi" 
					value={formDeskripsi}
					oninput={handleInputDeskripsi}
					class="textarea" 
					rows="4"
					placeholder="Tuliskan apa saja yang Anda pelajari dan kerjakan hari ini (auto-save draft aktif)..." 
					required
				></textarea>
			</div>

			<Button type="submit" variant="primary" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
			</Button>
		</form>
	</div>

	<div class="card">
		<h3 style="margin-bottom: var(--space-md);">Riwayat Jurnal</h3>
		{#if loading}
			<Skeleton variant="table" rows={4} />
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th style="width: 15%;">Tanggal</th>
							<th style="width: 50%;">Aktivitas</th>
							<th style="width: 15%;">Status</th>
							<th style="width: 20%;">Catatan Revisi</th>
						</tr>
					</thead>
					<tbody>
						{#if jurnals.length > 0}
							{#each jurnals as jurnal}
								<tr>
									<td>{new Date(jurnal.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
									<td><div style="white-space: pre-wrap;">{jurnal.deskripsi}</div></td>
									<td><span class="badge badge-{jurnal.status_approval}">{jurnal.status_approval}</span></td>
									<td>
										{#if jurnal.catatan_revisi}
											<div class="text-xs text-muted" style="background: var(--bg-muted); padding: var(--space-sm); border-radius: var(--radius); border-left: 2px solid var(--color-reject);">
												{jurnal.catatan_revisi}
											</div>
										{:else}
											-
										{/if}
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="4" class="text-center text-muted" style="padding: var(--space-xl) 0;">
									Belum ada jurnal. Silakan isi form di atas.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{:else if !$penempatan.loading}
	<div class="alert alert-warning">
		Data penempatan tidak ditemukan. Anda tidak dapat mengisi jurnal.
	</div>
{/if}
