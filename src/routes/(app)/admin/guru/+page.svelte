<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let gurus = $state([]);
	let loading = $state(true);
	
	// Form State
	let showModal = $state(false);
	let isSubmitting = $state(false);
	let formData = $state({ nama: '', nip: '' });

	let generatingAkun = $state(false);

	async function loadData() {
		loading = true;
		if ($auth.profile?.role === 'admin') {
			const { data } = await supabase.from('guru_pembimbing').select('*').order('nama');
			if (data) gurus = data;
		}
		loading = false;
	}

	onMount(() => {
		loadData();
	});

	async function handleSubmit(e) {
		e.preventDefault();
		if (!formData.nama || !formData.nip) {
			toast.error('Nama dan NIP wajib diisi');
			return;
		}
		
		isSubmitting = true;
		const { error } = await supabase.from('guru_pembimbing').insert([{
			nama: formData.nama,
			nip: formData.nip
		}]);
		
		isSubmitting = false;
		if (error) {
			toast.error('Gagal menambahkan guru: ' + error.message);
		} else {
			toast.success('Guru berhasil ditambahkan');
			showModal = false;
			formData = { nama: '', nip: '' };
			loadData();
		}
	}

	async function handleGenerateAkun() {
		generatingAkun = true;
		toast.success('Sedang membuat akun guru... Mohon tunggu.');
		try {
			const res = await fetch('/api/admin/generate-akun', { 
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'guru' })
			});
			const result = await res.json();
			if (result.success) {
				toast.success(result.message);
				loadData();
			} else {
				toast.error('Gagal: ' + result.message);
			}
		} catch (e) {
			toast.error('Gagal menghubungi server.');
		} finally {
			generatingAkun = false;
		}
	}
</script>
<svelte:head>
	<title>Data Guru | SiPKL Admin</title>
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
	<h1>Data Guru Pembimbing</h1>
	<div class="actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="secondary" size="sm" onclick={() => showModal = true}>➕ Tambah Guru</Button>
		<Button variant="primary" size="sm" style="background: #7c3aed;" onclick={handleGenerateAkun} disabled={generatingAkun}>
			{generatingAkun ? '⏳ Membuat Akun...' : '🔑 Generate Akun Guru'}
		</Button>
	</div>
</div>
<div class="card">
	<div class="table-wrapper">
		<table>
			<thead><tr><th>NIP & Email Login</th><th>Nama Guru</th><th>Status Akun</th></tr></thead>
			<tbody>
				{#if loading}
					<tr><td colspan="3" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if gurus.length > 0}
					{#each gurus as g}
						<tr>
							<td>
								<strong>{g.nip || '-'}</strong><br/>
								{#if g.nip}
									<small class="text-muted">{g.nip}@guru.smkn1magelang.sch.id</small>
								{/if}
							</td>
							<td><strong>{g.nama}</strong></td>
							<td>
								{#if g.user_id}
									<span class="badge badge-success">Aktif</span>
								{:else}
									<span class="badge badge-warning">Belum Punya Akun</span>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
				{:else}
					<tr><td colspan="3" class="text-center text-muted">Belum ada data guru.</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

{#if showModal}
	<Modal title="Tambah Guru Pembimbing" onClose={() => showModal = false}>
		<form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1rem;">
			<div class="form-group">
				<label for="nama">Nama Lengkap (beserta Gelar)</label>
				<input type="text" id="nama" class="form-control" bind:value={formData.nama} required placeholder="Contoh: Budi Santoso, S.Kom." />
			</div>
			<div class="form-group">
				<label for="nip">NIP (Nomor Induk Pegawai)</label>
				<input type="text" id="nip" class="form-control" bind:value={formData.nip} required placeholder="Contoh: 198001012005011003" />
				<small class="text-muted">NIP akan digunakan sebagai username login.</small>
			</div>
			
			<div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
				<Button type="button" variant="ghost" onclick={() => showModal = false}>Batal</Button>
				<Button type="submit" variant="primary" disabled={isSubmitting}>
					{isSubmitting ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</div>
		</form>
	</Modal>
{/if}
