<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let Chart;

	let loading = $state(true);
	let stats = $state({ siswa: 0, guru: 0, dudi: 0, perusahaan: 0, penempatan: 0, absensiToday: 0 });
	let chartCanvas = $state(null);
	let pieCanvas = $state(null);

	onMount(async () => {
		const chartModule = await import('chart.js/auto');
		Chart = chartModule.default;

		if ($auth.profile?.role === 'admin') {
			const today = new Date().toISOString().split('T')[0];

			// Fetch counts
			const pSiswa = supabase.from('siswa').select('id', { count: 'exact', head: true });
			const pGuru = supabase.from('guru_pembimbing').select('id', { count: 'exact', head: true });
			const pDudi = supabase.from('pembimbing_industri').select('id', { count: 'exact', head: true });
			const pPerusahaan = supabase.from('perusahaan').select('id', { count: 'exact', head: true });
			const pPenempatan = supabase.from('penempatan').select('id', { count: 'exact', head: true });
			const pAbsensi = supabase.from('absensi_pkl').select('id', { count: 'exact', head: true }).eq('tanggal', today);

			const [resSiswa, resGuru, resDudi, resPeru, resPene, resAbsen] = await Promise.all([
				pSiswa, pGuru, pDudi, pPerusahaan, pPenempatan, pAbsensi
			]);

			stats.siswa = resSiswa.count || 0;
			stats.guru = resGuru.count || 0;
			stats.dudi = resDudi.count || 0;
			stats.perusahaan = resPeru.count || 0;
			stats.penempatan = resPene.count || 0;
			stats.absensiToday = resAbsen.count || 0;

			// Render Charts
			setTimeout(() => {
				renderCharts();
			}, 100);
		}
		loading = false;
	});

	function renderCharts() {
		if (chartCanvas && Chart) {
			new Chart(chartCanvas, {
				type: 'bar',
				data: {
					labels: ['Siswa', 'Guru', 'DUDI', 'Perusahaan', 'Penempatan'],
					datasets: [{
						label: 'Total Entitas Terdaftar',
						data: [stats.siswa, stats.guru, stats.dudi, stats.perusahaan, stats.penempatan],
						backgroundColor: [
							'#0ea5e9', // Sky Blue
							'#0f766e', // Deep Teal
							'#f59e0b', // Amber
							'#8b5cf6', // Purple
							'#10b981'  // Emerald
						],
						borderWidth: 0,
						borderRadius: 6
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { 
						legend: { display: false } 
					},
					scales: {
						y: {
							beginAtZero: true,
							grid: { color: 'rgba(255, 255, 255, 0.05)' }
						},
						x: {
							grid: { display: false }
						}
					}
				}
			});
		}

		if (pieCanvas && Chart) {
			const belumDitempatkan = Math.max(0, stats.siswa - stats.penempatan);
			new Chart(pieCanvas, {
				type: 'doughnut',
				data: {
					labels: ['Sudah Penempatan', 'Belum Ditempatkan'],
					datasets: [{
						data: [stats.penempatan, belumDitempatkan],
						backgroundColor: [
							'#0ea5e9',
							'#334155'
						],
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '75%',
					plugins: {
						legend: {
							position: 'bottom',
							labels: { boxWidth: 12, font: { size: 11 } }
						}
					}
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
	<p>Kelola master data, penempatan PKL, registrasi biometrik wajah, dan pemantauan real-time.</p>
</div>

{#if loading}
	<div class="stats-grid mb-xl">
		<Skeleton variant="card" />
		<Skeleton variant="card" />
		<Skeleton variant="card" />
		<Skeleton variant="card" />
	</div>
	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-md);">
		<Skeleton variant="card" />
		<Skeleton variant="card" />
	</div>
{:else}
	<div class="stats-grid mb-xl" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
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
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-hadir);">{stats.absensiToday}</div>
			<div class="stat-label">Absensi Hari Ini</div>
		</div>
	</div>

	<!-- Chart Section -->
	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-md);" class="mb-lg">
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Statistik Data Utama</h3>
			<div style="position: relative; height: 260px;">
				<canvas bind:this={chartCanvas}></canvas>
			</div>
		</div>
		
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Status Penempatan Siswa</h3>
			<div style="position: relative; height: 260px; display: flex; align-items: center; justify-content: center;">
				<canvas bind:this={pieCanvas}></canvas>
				<div style="position: absolute; text-align: center; pointer-events: none; margin-bottom: 25px;">
					<div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">{stats.penempatan}</div>
					<div style="font-size: 0.7rem; color: var(--fg-muted);">Ditempatkan</div>
				</div>
			</div>
		</div>
	</div>

	<div class="card mb-lg">
		<h3 style="margin-bottom: var(--space-md);">Aksi Cepat & Navigasi Utama</h3>
		<div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
			<a href="/admin/monitor-tv" class="btn btn-primary">
				📺 Buka TV Monitor Command Center
			</a>
			<a href="/admin/absensi-wajah" class="btn btn-secondary">
				👤 Registrasi Biometrik Wajah
			</a>
			<a href="/admin/penempatan" class="btn btn-ghost">
				📌 Kelola Penempatan DUDI
			</a>
			<a href="/admin/siswa" class="btn btn-ghost">
				🎓 Master Siswa & Import Excel
			</a>
		</div>
	</div>
{/if}
