<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { penempatan } from '$lib/stores/penempatan.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';

	let laporan = $state(null);
	let loading = $state(true);
	let isUploading = $state(false);
	let fileInput = $state(null);

	onMount(async () => {
		if (!$penempatan.data && $auth.profile?.siswa_id) {
			await penempatan.fetchSiswaPenempatan($auth.profile.siswa_id);
		}
		if ($penempatan.data) {
			fetchLaporan();
		} else {
			loading = false;
		}
	});

	async function fetchLaporan() {
		loading = true;
		const { data, error } = await supabase
			.from('laporan_akhir')
			.select('*')
			.eq('penempatan_id', $penempatan.data.id)
			.single();
			
		if (data) laporan = data;
		loading = false;
	}

	async function handleUpload(e) {
		e.preventDefault();
		const file = fileInput?.files[0];
		
		if (!file) {
			toast.error('Silakan pilih file PDF laporan.');
			return;
		}
		
		if (file.type !== 'application/pdf') {
			toast.error('Hanya format file PDF yang diizinkan!');
			return;
		}
		
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Ukuran file maksimal 5MB.');
			return;
		}

		isUploading = true;
		try {
			// 1. Upload ke Storage Bucket "berkas_pkl"
			// Asumsi bucket "berkas_pkl" sudah dibuat di Supabase Storage secara publik
			const fileExt = file.name.split('.').pop();
			const fileName = `laporan_${$auth.profile.siswa_id}_${Date.now()}.${fileExt}`;
			const filePath = `${$penempatan.data.periode_id}/${fileName}`;
			
			const { error: uploadError, data } = await supabase.storage
				.from('berkas_pkl')
				.upload(filePath, file);

			if (uploadError) {
				// Handle case jika bucket tidak ada
				if (uploadError.message.includes('Bucket not found') || uploadError.statusCode === '404') {
					throw new Error('Storage Bucket "berkas_pkl" belum dibuat oleh Admin di Supabase.');
				}
				throw uploadError;
			}

			// Ambil URL Publik
			const { data: publicUrlData } = supabase.storage
				.from('berkas_pkl')
				.getPublicUrl(filePath);

			const fileUrl = publicUrlData.publicUrl;

			// 2. Simpan URL ke tabel laporan_akhir
			let res;
			if (laporan) {
				// Update existing
				res = await supabase.from('laporan_akhir').update({
					file_url: fileUrl,
					status: 'pending',
					updated_at: new Date().toISOString()
				}).eq('id', laporan.id);
			} else {
				// Insert new
				res = await supabase.from('laporan_akhir').insert([{
					penempatan_id: $penempatan.data.id,
					file_url: fileUrl,
					status: 'pending'
				}]);
			}
			
			if (res.error) throw res.error;

			toast.success('Laporan berhasil diunggah!');
			fetchLaporan();

		} catch (error) {
			toast.error(error.message);
		}
		isUploading = false;
	}
</script>

<svelte:head>
	<title>Laporan Akhir | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Laporan Akhir PKL</h1>
	<p>Unggah laporan komprehensif setelah periode PKL selesai</p>
</div>

{#if loading}
	<div style="display: flex; justify-content: center; padding: var(--space-2xl);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else if $penempatan.data}
	
	<div class="stats-grid mb-xl">
		<div class="stat-card">
			<div class="stat-label mb-sm">Status Laporan</div>
			{#if laporan}
				<span class="badge badge-{laporan.status}">{laporan.status}</span>
			{:else}
				<span class="badge badge-pending">Belum Submit</span>
			{/if}
		</div>
		<div class="stat-card">
			<div class="stat-label mb-sm">Nilai Angka</div>
			<div class="stat-value text-accent">{laporan?.nilai_angka ?? '-'}</div>
		</div>
	</div>

	{#if laporan && laporan.status === 'reject' && laporan.catatan_guru}
		<div class="alert alert-error mb-lg">
			<strong>Ditolak oleh Guru Pembimbing:</strong> {laporan.catatan_guru}
		</div>
	{/if}

	<div class="card">
		<h3 style="margin-bottom: var(--space-md);">Upload Laporan Baru</h3>
		<p class="text-sm text-muted mb-lg">Format wajib <strong class="text-accent">PDF</strong>, ukuran maksimal 5MB. Mengunggah ulang akan menimpa file laporan lama dan me-reset status menjadi Pending.</p>
		
		<form onsubmit={handleUpload} class="form-group">
			<div class="form-group mb-lg">
				<input 
					type="file" 
					accept=".pdf,application/pdf" 
					bind:this={fileInput} 
					class="input" 
					style="padding-top: 0.5rem;"
					required 
				/>
			</div>

			<div>
				<Button type="submit" variant="primary" disabled={isUploading}>
					{isUploading ? 'Sedang Mengunggah...' : 'Upload Dokumen'}
				</Button>

				{#if laporan?.file_url}
					<a href={laporan.file_url} target="_blank" rel="noopener noreferrer" style="margin-left: var(--space-md);">
						<Button variant="ghost">Lihat Laporan Saat Ini</Button>
					</a>
				{/if}
			</div>
		</form>
	</div>
{:else}
	<div class="alert alert-warning">
		Data penempatan tidak ditemukan.
	</div>
{/if}
