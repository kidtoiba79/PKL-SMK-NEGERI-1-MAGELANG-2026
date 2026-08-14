<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import Chart from 'chart.js/auto';

	let loading = $state(true);
	let stats = $state({ siswa: 0, guru: 0, dudi: 0, perusahaan: 0, penempatan: 0 });
	let chartCanvas;
	let pieCanvas;

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			// Fetch counts
			const pSiswa = supabase.from('siswa').select('id', { count: 'exact', head: true });
			const pGuru = supabase.from('guru_pembimbing').select('id', { count: 'exact', head: true });
			const pDudi = supabase.from('pembimbing_industri').select('id', { count: 'exact', head: true });
			const pPerusahaan = supabase.from('perusahaan').select('id', { count: 'exact', head: true });
			const pPenempatan = supabase.from('penempatan').select('id', { count: 'exact', head: true });

			const [resSiswa, resGuru, resDudi, resPeru, resPene] = await Promise.all([pSiswa, pGuru, pDudi, pPerusahaan, pPenempatan]);

			stats.siswa = resSiswa.count || 0;
			stats.guru = resGuru.count || 0;
			stats.dudi = resDudi.count || 0;
			stats.perusahaan = resPeru.count || 0;
			stats.penempatan = resPene.count || 0;

			// Render Charts
			setTimeout(() => {
				renderCharts();
			}, 100);
		}
		loading = false;
	});

	function renderCharts() {
		if (chartCanvas) {
			new Chart(chartCanvas, {
				type: 'bar',
				data: {
					labels: ['Siswa', 'Guru', 'Perusahaan', 'Penempatan'],
					datasets: [{
						label: 'Total Entitas',
						data: [stats.siswa, stats.guru, stats.perusahaan, stats.penempatan],
						backgroundColor: [
							'rgba(0, 153, 153, 0.7)',
							'rgba(11, 43, 43, 0.7)',
							'rgba(212, 175, 55, 0.7)',
							'rgba(5, 150, 105, 0.7)'
						],
						borderWidth: 0,
						borderRadius: 4
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } }
				}
			});
		}

		if (pieCanvas) {
			const belumDitempatkan = Math.max(0, stats.siswa - stats.penempatan);
			new Chart(pieCanvas, {
				type: 'doughnut',
				data: {
					labels: ['Sudah Penempatan', 'Belum Ditempatkan'],
					datasets: [{
						data: [stats.penempatan, belumDitempatkan],
						backgroundColor: [
							'#009999',
							'#e2e8f0'
						],
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '75%'
				}
			});
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Dashboard Administrator</h1>
	<p>Kelola master data, penempatan PKL, dan registrasi wajah siswa.</p>
</div>

{#if loading}
	<div style="display: flex; justify-content: center; padding: var(--space-2xl);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else}
	<div class="stats-grid mb-xl">
		<div class="stat-card">
			<div class="stat-value text-accent">{stats.siswa}</div>
			<div class="stat-label">Siswa PKL</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.perusahaan}</div>
			<div class="stat-label">Perusahaan (DUDI)</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.penempatan}</div>
			<div class="stat-label">Total Penempatan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.guru}</div>
			<div class="stat-label">Guru Pembimbing</div>
		</div>
	</div>

	<!-- Chart Section -->
	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-md);" class="mb-lg">
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Statistik Data Utama</h3>
			<div style="position: relative; height: 250px;">
				<canvas bind:this={chartCanvas}></canvas>
			</div>
		</div>
		
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Status Penempatan Siswa</h3>
			<div style="position: relative; height: 250px; display: flex; align-items: center; justify-content: center;">
				<canvas bind:this={pieCanvas}></canvas>
				<!-- Inner Text for Doughnut -->
				<div style="position: absolute; text-align: center; pointer-events: none;">
					<div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">{stats.penempatan}</div>
					<div style="font-size: 0.7rem; color: var(--fg-muted);">Ditempatkan</div>
				</div>
			</div>
		</div>
	</div>

	<div class="card mb-lg">
		<h3 style="margin-bottom: var(--space-md);">Shortcut Aksi</h3>
		<div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
			<a href="/admin/absensi-wajah" class="btn btn-primary">Registrasi Wajah Siswa</a>
			<a href="/admin/penempatan" class="btn btn-secondary">Kelola Penempatan</a>
			<a href="/admin/siswa" class="btn btn-ghost">Master Data Siswa</a>
		</div>
	</div>
{/if}
