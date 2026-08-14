<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { exportAttendancePDF, exportAttendanceExcelDetailed } from '$lib/exportHelper.js';

	let Chart;
	let chartCanvas = $state(null);

	let penempatans = $state([]);
	let absensiMap = $state({}); // Menyimpan status absen hari ini by siswa_id
	let absensiDetailMap = $state({}); // Menyimpan full record absen
	let loading = $state(true);
	let stats = $state({ totalSiswa: 0, totalPerusahaan: 0, hadir: 0, belum: 0, izin: 0, sakit: 0, alpa: 0 });

	onMount(async () => {
		const chartModule = await import('chart.js/auto');
		Chart = chartModule.default;

		if ($auth.profile?.guru_id) {
			const queryPenempatan = supabase
				.from('penempatan')
				.select(`
					id, 
					siswa (id, nama, nis, kelas, jurusan),
					perusahaan (nama, alamat),
					pembimbing_industri (nama)
				`)
				.eq('guru_id', $auth.profile.guru_id);
				
			const today = new Date().toISOString().split('T')[0];
			const queryAbsen = supabase
				.from('absensi_pkl')
				.select('*')
				.eq('tanggal', today);

			const [resPenempatan, resAbsen] = await Promise.all([queryPenempatan, queryAbsen]);

			if (resPenempatan.data) {
				penempatans = resPenempatan.data;
				stats.totalSiswa = penempatans.length;
				const uniqueDudi = new Set(penempatans.map(p => p.perusahaan?.nama));
				stats.totalPerusahaan = uniqueDudi.size;

				// Buat map absen dan hitung stat absen
				if (resAbsen.data) {
					let h = 0, i = 0, s = 0, a = 0;
					
					// Penempatan id set untuk filter siswa bimbingan guru ini
					const penempatanIds = new Set(penempatans.map(p => p.id));

					resAbsen.data.forEach(absen => {
						if (penempatanIds.has(absen.penempatan_id)) {
							// Cari siswa id dari penempatan
							const foundPenempatan = penempatans.find(p => p.id === absen.penempatan_id);
							if (foundPenempatan) {
								const sId = foundPenempatan.siswa.id;
								absensiMap[sId] = absen.status;
								absensiDetailMap[sId] = absen;

								const st = absen.status?.toLowerCase();
								if (st === 'hadir') h++;
								else if (st === 'izin') i++;
								else if (st === 'sakit') s++;
								else if (st === 'alpa') a++;
							}
						}
					});
					stats.hadir = h;
					stats.izin = i;
					stats.sakit = s;
					stats.alpa = a;
					stats.belum = Math.max(0, stats.totalSiswa - (h + i + s + a));
				}

				setTimeout(() => {
					renderChart();
				}, 100);
			}
		}
		loading = false;
	});

	function renderChart() {
		if (chartCanvas && Chart) {
			new Chart(chartCanvas, {
				type: 'doughnut',
				data: {
					labels: ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Belum Absen'],
					datasets: [{
						data: [stats.hadir, stats.izin, stats.sakit, stats.alpa, stats.belum],
						backgroundColor: [
							'#10b981', // Hadir (Green)
							'#f59e0b', // Izin (Amber)
							'#3b82f6', // Sakit (Blue)
							'#ef4444', // Alpa (Red)
							'#64748b'  // Belum (Slate)
						],
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '70%',
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

	function handleExportPDF() {
		if (penempatans.length === 0) {
			toast.info('Belum ada data siswa bimbingan untuk diekspor.');
			return;
		}

		const exportRows = penempatans.map(p => {
			const detail = absensiDetailMap[p.siswa.id] || {};
			return {
				siswa_nama: p.siswa.nama,
				siswa_kelas: p.siswa.kelas,
				perusahaan_nama: p.perusahaan?.nama,
				jam_masuk: detail.jam_masuk,
				jam_pulang: detail.jam_pulang,
				status: absensiMap[p.siswa.id] || 'Belum Absen',
				keterangan_izin: detail.keterangan_izin
			};
		});

		exportAttendancePDF({
			title: 'REKAPITULASI KEHADIRAN SISWA BIMBINGAN PKL',
			subtitle: `SMK Negeri 1 Magelang - Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
			data: exportRows,
			meta: {
				guruName: $auth.profile?.nama,
				filterDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
			},
			filename: `rekap_presensi_bimbingan_${new Date().toISOString().split('T')[0]}.pdf`
		});

		toast.success('Rekap PDF berhasil diunduh!');
	}

	function handleExportExcel() {
		if (penempatans.length === 0) {
			toast.info('Belum ada data siswa bimbingan untuk diekspor.');
			return;
		}

		const exportRows = penempatans.map(p => {
			const detail = absensiDetailMap[p.siswa.id] || {};
			return {
				siswa_nis: p.siswa.nis,
				siswa_nama: p.siswa.nama,
				siswa_kelas: p.siswa.kelas,
				siswa_jurusan: p.siswa.jurusan,
				perusahaan_nama: p.perusahaan?.nama,
				tanggal: detail.tanggal || new Date().toISOString().split('T')[0],
				jam_masuk: detail.jam_masuk,
				jam_pulang: detail.jam_pulang,
				status: absensiMap[p.siswa.id] || 'Belum Absen',
				keterangan_izin: detail.keterangan_izin,
				surat_izin_url: detail.surat_izin_url
			};
		});

		exportAttendanceExcelDetailed(exportRows, `rekap_presensi_bimbingan_${new Date().toISOString().split('T')[0]}.xlsx`);
		toast.success('Rekap Excel berhasil diunduh!');
	}
</script>

<svelte:head>
	<title>Dashboard Guru | SiPKL</title>
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
	<div>
		<h1>Dashboard Guru Pembimbing</h1>
		<p>Selamat datang, {$auth.profile?.nama}</p>
	</div>
	{#if penempatans.length > 0}
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<Button variant="secondary" size="sm" onclick={handleExportPDF}>
				<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
				</svg>
				Unduh PDF Rekap
			</Button>
			<Button variant="primary" size="sm" onclick={handleExportExcel}>
				<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
				</svg>
				Unduh Excel Rekap
			</Button>
		</div>
	{/if}
</div>

{#if loading}
	<div class="stats-grid mb-xl">
		<Skeleton variant="card" />
		<Skeleton variant="card" />
		<Skeleton variant="card" />
		<Skeleton variant="card" />
	</div>
	<Skeleton variant="table" rows={5} />
{:else}
	<div class="stats-grid mb-xl" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
		<div class="stat-card">
			<div class="stat-value text-accent">{stats.totalSiswa}</div>
			<div class="stat-label">Total Siswa Bimbingan</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.totalPerusahaan}</div>
			<div class="stat-label">Titik Perusahaan (DUDI)</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-hadir);">{stats.hadir}</div>
			<div class="stat-label">Hadir Hari Ini</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-izin);">{stats.izin + stats.sakit}</div>
			<div class="stat-label">Izin / Sakit</div>
		</div>
		<div class="stat-card">
			<div class="stat-value" style="color: var(--color-pending);">{stats.belum}</div>
			<div class="stat-label">Belum Absen</div>
		</div>
	</div>

	<!-- Chart Visual Breakdown -->
	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-md);" class="mb-lg">
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Status Kehadiran Siswa Hari Ini</h3>
			<div style="position: relative; height: 220px; display: flex; align-items: center; justify-content: center;">
				<canvas bind:this={chartCanvas}></canvas>
			</div>
		</div>
		<div class="card">
			<h3 style="margin-bottom: var(--space-md); font-size: 1rem;">Ringkasan Informasi</h3>
			<div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
					<span class="text-muted">Persentase Kehadiran</span>
					<strong class="text-accent">{stats.totalSiswa > 0 ? ((stats.hadir / stats.totalSiswa) * 100).toFixed(1) : 0}%</strong>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
					<span class="text-muted">Siswa Izin / Sakit</span>
					<span><strong>{stats.izin}</strong> Izin, <strong>{stats.sakit}</strong> Sakit</span>
				</div>
				<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
					<span class="text-muted">Tanggal Pantauan</span>
					<span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		<h3 style="margin-bottom: var(--space-md);">Daftar Siswa Bimbingan</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>NIS</th>
						<th>Nama Siswa</th>
						<th>Kelas</th>
						<th>Tempat PKL</th>
						<th>Status Absen (Hari Ini)</th>
						<th>Keterangan / Surat</th>
					</tr>
				</thead>
				<tbody>
					{#if penempatans.length > 0}
						{#each penempatans as p}
							<tr>
								<td>{p.siswa.nis}</td>
								<td><strong>{p.siswa.nama}</strong></td>
								<td>{p.siswa.kelas}</td>
								<td>
									{p.perusahaan?.nama || '-'}<br/>
									<small class="text-muted">{p.pembimbing_industri?.nama || 'Tanpa Pemb. DUDI'}</small>
								</td>
								<td>
									{#if absensiMap[p.siswa.id] === 'hadir'}
										<span class="badge badge-success">Hadir</span>
									{:else if absensiMap[p.siswa.id] === 'izin'}
										<span class="badge badge-warning" style="background: var(--color-izin);">Izin</span>
									{:else if absensiMap[p.siswa.id] === 'sakit'}
										<span class="badge badge-warning" style="background: var(--color-sakit);">Sakit</span>
									{:else if absensiMap[p.siswa.id] === 'alpa'}
										<span class="badge badge-danger">Alpa</span>
									{:else}
										<span class="badge badge-secondary">Belum Absen</span>
									{/if}
								</td>
								<td>
									{#if absensiDetailMap[p.siswa.id]?.keterangan_izin}
										<div class="text-xs">
											{absensiDetailMap[p.siswa.id].keterangan_izin}
											{#if absensiDetailMap[p.siswa.id]?.surat_izin_url}
												<br/>
												<a href={absensiDetailMap[p.siswa.id].surat_izin_url} target="_blank" rel="noopener noreferrer" class="text-accent">
													📄 Lihat Surat
												</a>
											{/if}
										</div>
									{:else}
										-
									{/if}
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="6" class="text-center text-muted" style="padding: var(--space-xl) 0;">
								Anda belum memiliki siswa bimbingan.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{/if}
