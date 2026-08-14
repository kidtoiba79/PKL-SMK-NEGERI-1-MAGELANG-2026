<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { penempatan } from '$lib/stores/penempatan.js';
	import { supabase } from '$lib/supabase.js';
	import Button from '$lib/components/Button.svelte';

	let history = $state([]);
	let loadingHistory = $state(true);

	onMount(async () => {
		if ($auth.profile?.siswa_id) {
			await penempatan.fetchSiswaPenempatan($auth.profile.siswa_id);
			if ($penempatan.data) {
				const { data } = await supabase
					.from('absensi_pkl')
					.select('*')
					.eq('penempatan_id', $penempatan.data.id)
					.order('tanggal', { ascending: false })
					.limit(5);
				if (data) history = data;
			}
			loadingHistory = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard Siswa | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Dashboard Siswa</h1>
	<p>Selamat datang, {$auth.profile?.nama}</p>
</div>

{#if $penempatan.loading}
	<div style="display: flex; justify-content: center; padding: var(--space-2xl);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else if $penempatan.data}
	<div class="stats-grid mb-xl">
		<div class="stat-card">
			<div class="stat-value text-accent">{history.filter(h => h.status === 'hadir').length}</div>
			<div class="stat-label">Kehadiran Bulan Ini</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-izin);">{history.filter(h => h.status === 'izin' || h.status === 'sakit').length}</div>
			<div class="stat-label">Izin / Sakit</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-reject);">{history.filter(h => h.status === 'alpa').length}</div>
			<div class="stat-label">Alpa</div>
		</div>
	</div>

	<div class="card mb-xl">
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
			<h3>Informasi Penempatan</h3>
		</div>
		<p><strong>Perusahaan:</strong> {$penempatan.data.perusahaan.nama}</p>
		<p><strong>Alamat:</strong> {$penempatan.data.perusahaan.alamat}</p>
		<div class="divider mt-md mb-md"></div>
		<p><strong>Pembimbing Industri:</strong> {$penempatan.data.pembimbing_industri?.nama || 'Belum ada'}</p>
		<p><strong>Guru Pembimbing:</strong> {$penempatan.data.guru_pembimbing?.nama || 'Belum ada'}</p>
	</div>

	<div class="card">
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
			<h3>Riwayat Absensi Terakhir</h3>
			<a href="/siswa/absensi" class="btn btn-primary btn-sm">Absen Sekarang</a>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Tanggal</th>
						<th>Jam Masuk</th>
						<th>Jam Pulang</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#if loadingHistory}
						<tr><td colspan="4" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
					{:else if history.length > 0}
						{#each history as item}
							<tr>
								<td>{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
								<td>{item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
								<td>{item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
								<td><span class="badge badge-{item.status}">{item.status}</span></td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="4" class="text-center text-muted" style="padding: var(--space-xl) 0;">
								Belum ada riwayat absensi. Mulai absensi pertama Anda!
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="alert alert-warning">
		Anda belum memiliki data penempatan PKL aktif. Silakan hubungi Guru Pembimbing atau Admin sekolah Anda.
	</div>
{/if}
