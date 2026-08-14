<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let loading = $state(true);
	let laporans = $state([]);

	// Modal State
	let selectedLaporan = $state(null);
	let showModal = $state(false);
	let nilaiAngka = $state('');
	let catatanGuru = $state('');
	let isSubmitting = $state(false);
	let actionType = $state(''); // 'approve' | 'reject'

	onMount(() => {
		fetchLaporan();
	});

	async function fetchLaporan() {
		if (!$auth.profile?.guru_id) return;
		loading = true;

		// Ambil penempatan_id untuk guru ini
		const { data: penempatanData } = await supabase
			.from('penempatan')
			.select('id, siswa(nama, kelas), perusahaan(nama)')
			.eq('guru_id', $auth.profile.guru_id);

		if (!penempatanData || penempatanData.length === 0) {
			laporans = [];
			loading = false;
			return;
		}

		const penempatanIds = penempatanData.map(p => p.id);
		const penempatanMap = {};
		penempatanData.forEach(p => { penempatanMap[p.id] = p; });

		// Ambil laporan
		const { data: laporanData } = await supabase
			.from('laporan_akhir')
			.select('*')
			.in('penempatan_id', penempatanIds)
			.order('status', { ascending: false }) // 'pending' (p) diletakkan dekat bawah, kita sort di client
			.order('created_at', { ascending: false });

		if (laporanData) {
			laporans = laporanData.map(l => ({
				...l,
				siswa: penempatanMap[l.penempatan_id].siswa,
				perusahaan: penempatanMap[l.penempatan_id].perusahaan
			})).sort((a, b) => {
				if (a.status === 'pending' && b.status !== 'pending') return -1;
				if (b.status === 'pending' && a.status !== 'pending') return 1;
				return 0;
			});
		}
		
		loading = false;
	}

	function openModal(laporan, type) {
		selectedLaporan = laporan;
		actionType = type;
		nilaiAngka = laporan.nilai_angka || '';
		catatanGuru = laporan.catatan_guru || '';
		showModal = true;
	}

	async function submitPenilaian() {
		if (actionType === 'approve' && (nilaiAngka === '' || nilaiAngka < 0 || nilaiAngka > 100)) {
			toast.error('Nilai wajib diisi antara 0 - 100 jika menyetujui.');
			return;
		}
		
		if (actionType === 'reject' && !catatanGuru.trim()) {
			toast.error('Catatan revisi wajib diisi jika menolak.');
			return;
		}

		isSubmitting = true;
		const payload = {
			status: actionType,
			updated_at: new Date().toISOString()
		};

		if (actionType === 'approve') {
			payload.nilai_angka = parseInt(nilaiAngka, 10);
			payload.catatan_guru = catatanGuru.trim() || null;
		} else {
			payload.nilai_angka = null;
			payload.catatan_guru = catatanGuru.trim();
		}

		const { error } = await supabase
			.from('laporan_akhir')
			.update(payload)
			.eq('id', selectedLaporan.id);

		if (error) {
			toast.error('Gagal menyimpan: ' + error.message);
		} else {
			toast.success(actionType === 'approve' ? 'Nilai berhasil disimpan!' : 'Laporan ditolak (butuh revisi).');
			showModal = false;
			fetchLaporan();
		}
		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Penilaian Laporan | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Penilaian Laporan Akhir</h1>
	<p>Review laporan PDF siswa dan berikan nilai (0-100).</p>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Siswa & DUDI</th>
					<th>File Laporan</th>
					<th>Status</th>
					<th>Nilai Akhir</th>
					<th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="5" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if laporans.length > 0}
					{#each laporans as l}
						<tr style={l.status === 'pending' ? 'background-color: var(--bg-surface);' : ''}>
							<td>
								<strong>{l.siswa.nama}</strong><br/>
								<span class="text-xs text-muted">{l.perusahaan?.nama}</span>
							</td>
							<td>
								<a href={l.file_url} target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 0.25rem;">
									<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
									Lihat PDF
								</a>
							</td>
							<td><span class="badge badge-{l.status}">{l.status}</span></td>
							<td>
								{#if l.nilai_angka !== null && l.nilai_angka !== undefined}
									<strong class="text-accent text-lg">{l.nilai_angka}</strong>
								{:else}
									-
								{/if}
							</td>
							<td>
								<div style="display: flex; gap: 0.25rem;">
									<Button size="sm" variant="accent" onclick={() => openModal(l, 'approve')}>
										{l.status === 'approve' ? 'Edit Nilai' : 'Beri Nilai'}
									</Button>
									{#if l.status !== 'approve'}
										<Button size="sm" variant="danger" onclick={() => openModal(l, 'reject')}>Tolak</Button>
									{/if}
								</div>
								{#if l.status === 'reject'}
									<div class="text-xs text-muted mt-sm">Revisi: {l.catatan_guru}</div>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="text-center text-muted" style="padding: var(--space-xl) 0;">
							Belum ada laporan akhir yang di-submit siswa.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<Modal show={showModal} title={actionType === 'approve' ? 'Penilaian Laporan' : 'Tolak Laporan (Revisi)'} onclose={() => !isSubmitting && (showModal = false)}>
	<div class="form-group mb-md">
		<label class="form-label">Siswa</label>
		<p><strong>{selectedLaporan?.siswa.nama}</strong></p>
	</div>

	{#if actionType === 'approve'}
		<div class="form-group mb-md">
			<label class="form-label" for="nilai">Nilai Angka (0 - 100) *</label>
			<input type="number" id="nilai" bind:value={nilaiAngka} class="input" min="0" max="100" required />
		</div>
		<div class="form-group mb-md">
			<label class="form-label" for="catatan">Catatan / Pesan (Opsional)</label>
			<textarea id="catatan" bind:value={catatanGuru} class="textarea" rows="2"></textarea>
		</div>
	{:else}
		<div class="form-group mb-md">
			<label class="form-label" for="catatan">Alasan Penolakan (Wajib) *</label>
			<textarea id="catatan" bind:value={catatanGuru} class="textarea" rows="3" placeholder="Contoh: Format laporan salah, perbaiki bab 3..."></textarea>
		</div>
	{/if}

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showModal = false} disabled={isSubmitting}>Batal</Button>
		<Button variant={actionType === 'approve' ? 'primary' : 'danger'} onclick={submitPenilaian} disabled={isSubmitting}>
			{isSubmitting ? 'Menyimpan...' : 'Simpan'}
		</Button>
	{/snippet}
</Modal>
