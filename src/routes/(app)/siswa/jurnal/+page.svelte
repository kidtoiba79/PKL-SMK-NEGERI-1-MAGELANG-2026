<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { penempatan } from '$lib/stores/penempatan.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';

	let jurnals = $state([]);
	let loading = $state(true);
	
	let formTanggal = $state(new Date().toISOString().split('T')[0]);
	let formDeskripsi = $state('');
	let isSubmitting = $state(false);

	onMount(async () => {
		if (!$penempatan.data && $auth.profile?.siswa_id) {
			await penempatan.fetchSiswaPenempatan($auth.profile.siswa_id);
		}
		if ($penempatan.data) {
			fetchJurnals();
		} else {
			loading = false;
		}
	});

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
			jurnals = data;
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
			formDeskripsi = ''; // Reset form
			fetchJurnals(); // Refresh tabel
		}
		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Jurnal Harian | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Jurnal Harian</h1>
	<p>Catat aktivitas harian Praktik Kerja Lapangan Anda</p>
</div>

{#if $penempatan.data}
	<div class="card mb-xl">
		<h3 style="margin-bottom: var(--space-md);">Isi Jurnal Baru</h3>
		<form onsubmit={submitJurnal}>
			<div class="form-group mb-md">
				<label class="form-label" for="tanggal">Tanggal Kegiatan</label>
				<input type="date" id="tanggal" bind:value={formTanggal} class="input" required max={new Date().toISOString().split('T')[0]} />
			</div>
			
			<div class="form-group mb-lg">
				<label class="form-label" for="deskripsi">Deskripsi Pekerjaan / Aktivitas</label>
				<textarea id="deskripsi" bind:value={formDeskripsi} class="textarea" placeholder="Tuliskan apa saja yang Anda kerjakan hari ini..." required></textarea>
			</div>

			<Button type="submit" variant="primary" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
			</Button>
		</form>
	</div>

	<div class="card">
		<h3 style="margin-bottom: var(--space-md);">Riwayat Jurnal</h3>
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
					{#if loading}
						<tr><td colspan="4" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
					{:else if jurnals.length > 0}
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
	</div>
{:else if !$penempatan.loading}
	<div class="alert alert-warning">
		Data penempatan tidak ditemukan. Anda tidak dapat mengisi jurnal.
	</div>
{/if}
