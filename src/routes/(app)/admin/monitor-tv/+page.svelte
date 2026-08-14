<script>
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase.js';
	import MapModal from '$lib/components/MapModal.svelte';

	let L;
	let map;
	let perusahaans = $state([]);
	let absensis = $state([]);
	let selectedAbsensi = $state(null);
	let currentTime = $state(new Date());
	
	let refreshInterval;
	let timeInterval;

	onMount(async () => {
		// Dark mode khusus TV
		document.body.classList.add('tv-mode');

		L = await import('leaflet');
		
		// Inisialisasi peta
		map = L.map('tv-map', {
			zoomControl: false // Sembunyikan zoom control untuk TV
		}).setView([-7.4704, 110.2177], 13); // Default Magelang

		// Gunakan peta satelit atau peta gelap (opsional, ini pakai OSM standard tapi kita filter di CSS)
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);

		await fetchPerusahaans();
		await fetchAbsensis();

		// Auto refresh tiap 30 detik
		refreshInterval = setInterval(fetchAbsensis, 30000);
		
		// Jam Digital
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		document.body.classList.remove('tv-mode');
		if (map) map.remove();
		clearInterval(refreshInterval);
		clearInterval(timeInterval);
	});

	async function fetchPerusahaans() {
		const { data } = await supabase.from('perusahaan').select('*').not('lat', 'is', null);
		if (data) {
			perusahaans = data;
			
			const icon = L.icon({
				iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
				iconSize: [25, 41], iconAnchor: [12, 41]
			});

			data.forEach(p => {
				L.marker([p.lat, p.lng], { icon })
					.addTo(map)
					.bindTooltip(p.nama, { permanent: false, direction: 'top' });
			});
		}
	}

	async function fetchAbsensis() {
		const today = new Date().toISOString().split('T')[0];
		const { data } = await supabase
			.from('absensi_pkl')
			.select(`
				*,
				siswa (nama, kelas),
				penempatan (
					perusahaan (nama, lat, lng, radius_meter)
				)
			`)
			.gte('waktu', `${today}T00:00:00Z`)
			.lte('waktu', `${today}T23:59:59Z`)
			.order('waktu', { ascending: false })
			.limit(20);

		if (data) {
			absensis = data;
		}
	}

	function openVerifikasiMap(absensi) {
		selectedAbsensi = absensi;
	}

	function formatTime(isoString) {
		const date = new Date(isoString);
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Command Center TV | SiPKL</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<!-- Layout Fullscreen untuk TV -->
<div class="tv-layout">
	<!-- Peta Raksasa di Background/Sebelah Kiri -->
	<div id="tv-map" class="tv-map-container"></div>
	
	<!-- Panel Kanan: Sidebar Informasi -->
	<div class="tv-sidebar">
		<div class="tv-header">
			<div class="logo">
				<h2>SiPKL Command Center</h2>
				<p>SMK Negeri 1 Magelang</p>
			</div>
			<div class="clock">
				<div class="time">{currentTime.toLocaleTimeString('id-ID')}</div>
				<div class="date">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
			</div>
		</div>

		<div class="live-feed-title">
			<h3>🔴 Live Absensi Hari Ini</h3>
			<span class="badge badge-success">Auto Refresh: 30s</span>
		</div>

		<div class="feed-container">
			{#each absensis as a}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="feed-card" onclick={() => openVerifikasiMap(a)}>
					<div class="feed-time">{formatTime(a.waktu)}</div>
					<div class="feed-content">
						<strong>{a.siswa?.nama}</strong>
						<div class="text-xs text-muted" style="margin: 4px 0;">{a.penempatan?.perusahaan?.nama}</div>
						<div style="display: flex; gap: 5px; margin-top: 5px;">
							<span class="badge {a.tipe === 'masuk' ? 'badge-primary' : 'badge-warning'}">{a.tipe.toUpperCase()}</span>
							<span class="badge {a.status === 'Hadir' ? 'badge-success' : 'badge-danger'}">{a.status}</span>
						</div>
					</div>
					<div class="feed-action">
						<button class="btn-map" title="Verifikasi Peta">📍</button>
					</div>
				</div>
			{/each}
			
			{#if absensis.length === 0}
				<div class="text-center" style="padding: 2rem; color: #888;">Belum ada data absensi hari ini.</div>
			{/if}
		</div>
	</div>
</div>

{#if selectedAbsensi}
	<MapModal absensi={selectedAbsensi} onClose={() => selectedAbsensi = null} />
{/if}

<style>
	/* Global overrides just for this page */
	:global(.tv-mode .sidebar), :global(.tv-mode .navbar) {
		display: none !important;
	}
	:global(.tv-mode .main-content) {
		margin: 0 !important;
		padding: 0 !important;
	}

	.tv-layout {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: #000;
	}

	.tv-map-container {
		flex: 1;
		height: 100%;
		/* Darken map for TV look via CSS filter */
		filter: brightness(0.8) contrast(1.2) invert(0) grayscale(0.5) sepia(0.2) hue-rotate(180deg);
	}

	.tv-sidebar {
		width: 450px;
		background: rgba(15, 23, 42, 0.95); /* Tailwind slate-900 */
		color: white;
		display: flex;
		flex-direction: column;
		border-left: 2px solid #1e293b;
		box-shadow: -10px 0 30px rgba(0,0,0,0.5);
		z-index: 10;
	}

	.tv-header {
		padding: 1.5rem;
		border-bottom: 1px solid #334155;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: #0f172a;
	}

	.tv-header h2 { margin: 0; color: #38bdf8; font-size: 1.5rem; font-weight: 700; letter-spacing: 1px;}
	.tv-header p { margin: 0; color: #94a3b8; font-size: 0.9rem;}

	.clock {
		background: #1e293b;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
		border: 1px solid #334155;
	}
	.time { font-size: 2.5rem; font-weight: 700; color: #f8fafc; font-variant-numeric: tabular-nums; }
	.date { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }

	.live-feed-title {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}
	.live-feed-title h3 { margin: 0; font-size: 1.1rem; color: #f8fafc; }

	.feed-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Sembunyikan scrollbar untuk tampilan bersih di TV */
	.feed-container::-webkit-scrollbar { width: 0px; }

	.feed-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.feed-card:hover {
		background: #334155;
		transform: translateX(-5px);
		border-color: #38bdf8;
	}

	.feed-time {
		font-size: 1.2rem;
		font-weight: bold;
		color: #38bdf8;
		padding-right: 1rem;
		border-right: 1px solid #334155;
	}

	.feed-content { flex: 1; }
	
	.feed-action .btn-map {
		background: rgba(56, 189, 248, 0.1);
		border: 1px solid rgba(56, 189, 248, 0.3);
		color: #38bdf8;
		font-size: 1.5rem;
		width: 40px; height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: all 0.2s;
	}
	.feed-card:hover .btn-map {
		background: #38bdf8; color: white;
	}
</style>
