<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let loading = $state(true);
	let jurnals = $state([]);

	// Modal State
	let selectedJurnal = $state(null);
	let showModal = $state(false);
	let catatanRevisi = $state('');
	let actionType = $state(''); // 'approve' | 'reject'
	let isSubmitting = $state(false);

	onMount(() => {
		fetchJurnals();
	});

	async function fetchJurnals() {
		if (!$auth.profile?.perusahaan_id) return;
		loading = true;

		// Ambil penempatan_id perusahaan ini
		const { data: penempatanData } = await supabase
			.from('penempatan')
			.select('id, siswa(nama, kelas)')
			.eq('perusahaan_id', $auth.profile.perusahaan_id);

		if (!penempatanData || penempatanData.length === 0) {
			jurnals = [];
			loading = false;
			return;
		}

		const penempatanIds = penempatanData.map(p => p.id);
		const siswaMap = {};
		penempatanData.forEach(p => { siswaMap[p.id] = p.siswa; });

		// Ambil jurnal, prioritaskan yang pending di atas
		const { data: jurnalData, error } = await supabase
			.from('jurnal_kegiatan')
			.select('*')
			.in('penempatan_id', penempatanIds)
			.order('status_approval', { ascending: false }) // 'pending' (p) ada di bawah 'approve'(a), tapi kita sort custom di frontend lebih mudah
			.order('tanggal', { ascending: false });

		if (jurnalData) {
			// Custom sort: pending ditaruh paling atas
			jurnals = jurnalData.map(j => ({ ...j, siswa: siswaMap[j.penempatan_id] })).sort((a, b) => {
				if (a.status_approval === 'pending' && b.status_approval !== 'pending') return -1;
				if (b.status_approval === 'pending' && a.status_approval !== 'pending') return 1;
				return 0;
			});
		}
		
		loading = false;
	}

	function openModal(jurnal, type) {
		selectedJurnal = jurnal;
		actionType = type;
		catatanRevisi = '';
		showModal = true;
	}

	async function submitAction() {
		if (actionType === 'reject' && !catatanRevisi.trim()) {
			toast.error('Catatan revisi wajib diisi jika menolak jurnal.');
			return;
		}

		isSubmitting = true;
		const { error } = await supabase
			.from('jurnal_kegiatan')
			.update({
				status_approval: actionType,
				catatan_revisi: actionType === 'reject' ? catatanRevisi.trim() : null,
				updated_at: new Date().toISOString()
			})
			.eq('id', selectedJurnal.id);

		if (error) {
			toast.error('Gagal memperbarui status: ' + error.message);
		} else {
			toast.success(`Jurnal berhasil di-${actionType}`);
			showModal = false;
			fetchJurnals(); // refresh list
		}
		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Validasi Jurnal | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Validasi Jurnal Siswa</h1>
	<p>Periksa dan setujui aktivitas harian siswa PKL di perusahaan Anda</p>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th style="width: 15%;">Tanggal</th>
					<th style="width: 20%;">Siswa</th>
					<th style="width: 40%;">Deskripsi Kegiatan</th>
					<th style="width: 10%;">Status</th>
					<th style="width: 15%;">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="5" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if jurnals.length > 0}
					{#each jurnals as j}
						<tr style={j.status_approval === 'pending' ? 'background-color: var(--bg-surface);' : ''}>
							<td>{new Date(j.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</td>
							<td>
								<strong>{j.siswa.nama}</strong><br/>
								<span class="text-xs text-muted">{j.siswa.kelas}</span>
							</td>
							<td><div style="white-space: pre-wrap; font-size: 0.8rem;">{j.deskripsi}</div></td>
							<td><span class="badge badge-{j.status_approval}">{j.status_approval}</span></td>
							<td>
								{#if j.status_approval === 'pending'}
									<div style="display: flex; gap: 0.25rem;">
										<Button size="sm" variant="accent" onclick={() => openModal(j, 'approve')}>Setujui</Button>
										<Button size="sm" variant="danger" onclick={() => openModal(j, 'reject')}>Tolak</Button>
									</div>
								{:else if j.status_approval === 'reject'}
									<div class="text-xs text-muted">Direvisi:<br/>{j.catatan_revisi}</div>
								{:else}
									<span class="text-xs text-muted">Selesai</span>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="text-center text-muted" style="padding: var(--space-xl) 0;">
							Belum ada jurnal yang masuk dari siswa.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<Modal show={showModal} title={actionType === 'approve' ? 'Setujui Jurnal' : 'Tolak Jurnal (Revisi)'} onclose={() => !isSubmitting && (showModal = false)}>
	{#if actionType === 'approve'}
		<p>Apakah Anda yakin menyetujui aktivitas jurnal dari <strong>{selectedJurnal?.siswa.nama}</strong> pada tanggal {selectedJurnal?.tanggal}?</p>
	{:else}
		<p class="mb-md">Berikan alasan/catatan mengapa jurnal ini ditolak agar siswa dapat memperbaikinya:</p>
		<div class="form-group">
			<textarea class="textarea" bind:value={catatanRevisi} placeholder="Tulis catatan revisi di sini..." rows="3"></textarea>
		</div>
	{/if}

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showModal = false} disabled={isSubmitting}>Batal</Button>
		<Button variant={actionType === 'approve' ? 'primary' : 'danger'} onclick={submitAction} disabled={isSubmitting}>
			{isSubmitting ? 'Memproses...' : (actionType === 'approve' ? 'Ya, Setujui' : 'Kirim Penolakan')}
		</Button>
	{/snippet}
</Modal>
