<script>
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabase.js';
	import MapModal from '$lib/components/MapModal.svelte';

	let L;
	let map;
	let markersLayer;
	let perusahaans = $state([]);
	let absensis = $state([]);
	let selectedAbsensi = $state(null);
	let currentTime = $state(new Date());
	let realtimeChannel = null;
	
	let refreshInterval;
	let timeInterval;

	onMount(async () => {
		// Dark mode khusus TV
		document.body.classList.add('tv-mode');

		L = await import('leaflet');
		
		// Inisialisasi peta
		map = L.map('tv-map', {
			zoomControl: false
		}).setView([-7.4704, 110.2177], 13); // Default Magelang

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);

		markersLayer = L.layerGroup().addTo(map);

		await fetchPerusahaans();
		await fetchAbsensis();

		// Realtime Supabase Subscription
		realtimeChannel = supabase
			.channel('tv_absensi_feed')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'absensi_pkl' }, () => {
				fetchAbsensis();
			})
			.subscribe();

		// Auto refresh interval tiap 15 detik sebagai fallback
		refreshInterval = setInterval(fetchAbsensis, 15000);
		
		// Jam Digital
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		document.body.classList.remove('tv-mode');
		if (map) map.remove();
		if (realtimeChannel) supabase.removeChannel(realtimeChannel);
		clearInterval(refreshInterval);
		clearInterval(timeInterval);
	});

	async function fetchPerusahaans() {
		const { data } = await supabase.from('perusahaan').select('*').not('lat', 'is', null);
		if (data) {
			perusahaans = data;
			
			const iconDudi = L.icon({
				iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
				iconSize: [25, 41], 
				iconAnchor: [12, 41]
			});

			data.forEach(p => {
				if (p.lat && p.lng) {
					// Lingkaran radius
					L.circle([p.lat, p.lng], {
						color: '#0ea5e9',
						fillColor: '#0ea5e9',
						fillOpacity: 0.15,
						radius: p.radius_meter || 500
					}).addTo(map);

					L.marker([p.lat, p.lng], { icon: iconDudi })
						.addTo(map)
						.bindTooltip(`<b>${p.nama}</b><br/>Radius: ${p.radius_meter || 500}m`, { direction: 'top' });
				}
			});
		}
	}

	async function fetchAbsensis() {
		const today = new Date().toISOString().split('T')[0];
		const { data, error } = await supabase
			.from('absensi_pkl')
			.select(`
				*,
				penempatan (
					id,
					siswa (id, nama, kelas, nis),
					perusahaan (id, nama, lat, lng, radius_meter)
				)
			`)
			.eq('tanggal', today)
			.order('updated_at', { ascending: false })
			.limit(30);

		if (data) {
			absensis = data.map(item => {
				const isPulang = !!item.jam_pulang;
				const waktu = isPulang ? item.jam_pulang : (item.jam_masuk || item.created_at);
				const lat = isPulang ? (item.lat_pulang || item.lat_masuk) : item.lat_masuk;
				const lng = isPulang ? (item.lng_pulang || item.lng_masuk) : item.lng_masuk;
				const tipe = item.status === 'hadir' ? (isPulang ? 'pulang' : 'masuk') : item.status;

				return {
					...item,
					siswa: item.penempatan?.siswa,
					waktu: waktu,
					lat: lat,
					lng: lng,
					tipe: tipe
				};
			});

			updateMapMarkers();
		}
	}

	function updateMapMarkers() {
		if (!map || !markersLayer || !L) return;
		markersLayer.clearLayers();

		const iconHadir = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41]
		});

		absensis.forEach(a => {
			if (a.lat && a.lng) {
				const marker = L.marker([a.lat, a.lng], { icon: iconHadir })
					.bindPopup(`
						<div style="font-family: sans-serif;">
							<strong style="color: #0ea5e9;">${a.siswa?.nama || 'Siswa'}</strong><br/>
							<small>${a.siswa?.kelas || ''}</small><br/>
							<b>Status:</b> ${a.status?.toUpperCase()}<br/>
							<b>Waktu:</b> ${formatTime(a.waktu)}
						</div>
					`);
				markersLayer.addLayer(marker);
			}
		});
	}

	function openVerifikasiMap(absensi) {
		selectedAbsensi = absensi;
		if (map && absensi.lat && absensi.lng) {
			map.flyTo([absensi.lat, absensi.lng], 16, { duration: 1.5 });
		}
	}

	function formatTime(isoString) {
		if (!isoString) return '-';
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
			<div class="logo" style="display: flex; align-items: center; gap: 1rem;">
				<a href="/admin" class="btn-back" title="Kembali ke Dashboard">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</a>
				<div>
					<h2>SiPKL Command Center</h2>
					<p>SMK Negeri 1 Magelang</p>
				</div>
			</div>
			<div class="clock">
				<div class="time">{currentTime.toLocaleTimeString('id-ID')}</div>
				<div class="date">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
			</div>
		</div>

		<div class="live-feed-title">
			<h3>🔴 Live Presensi Hari Ini</h3>
			<span class="badge badge-success">Realtime Active</span>
		</div>

		<div class="feed-container">
			{#each absensis as a}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="feed-card" onclick={() => openVerifikasiMap(a)}>
					<div class="feed-time">{formatTime(a.waktu)}</div>
					<div class="feed-content">
						<strong>{a.siswa?.nama || 'Siswa'}</strong>
						<div class="text-xs text-muted" style="margin: 4px 0;">
							{a.penempatan?.perusahaan?.nama || 'DUDI'} ({a.siswa?.kelas || '-'})
						</div>
						<div style="display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;">
							{#if a.status === 'hadir'}
								<span class="badge {a.tipe === 'masuk' ? 'badge-primary' : 'badge-warning'}">
									{a.tipe.toUpperCase()}
								</span>
								<span class="badge badge-success">HADIR</span>
								{#if a.face_confidence_masuk || a.face_confidence_pulang}
									<span class="text-xs" style="color: #10b981;">
										AI: {((a.face_confidence_pulang || a.face_confidence_masuk) * 100).toFixed(0)}%
									</span>
								{/if}
							{:else if a.status === 'izin'}
								<span class="badge" style="background: var(--color-izin, #f59e0b); color: #fff;">IZIN</span>
								<span class="text-xs text-muted">{a.keterangan_izin || ''}</span>
							{:else if a.status === 'sakit'}
								<span class="badge" style="background: var(--color-sakit, #3b82f6); color: #fff;">SAKIT</span>
								<span class="text-xs text-muted">{a.keterangan_izin || ''}</span>
							{:else}
								<span class="badge badge-danger">ALPA</span>
							{/if}
						</div>
					</div>
					<div class="feed-action">
						<button class="btn-map" title="Verifikasi Peta">📍</button>
					</div>
				</div>
			{/each}
			
			{#if absensis.length === 0}
				<div class="text-center" style="padding: 2.5rem 1rem; color: #888;">
					<div style="font-size: 2rem; margin-bottom: 0.5rem;">⏱️</div>
					Belum ada data presensi siswa yang masuk hari ini.
				</div>
			{/if}
		</div>
	</div>
</div>

{#if selectedAbsensi}
	<MapModal absensi={selectedAbsensi} onClose={() => selectedAbsensi = null} />
{/if}

<style>
	:global(.tv-mode .sidebar), :global(.tv-mode .navbar) {
		display: none !important;
	}
	:global(.tv-mode .main-wrapper) {
		margin-left: 0 !important;
	}
	:global(.tv-mode .main-content) {
		margin: 0 !important;
		padding: 0 !important;
	}

	.tv-layout {
		display: flex;
		height: 100vh;
		width: 100%;
		overflow: hidden;
		background: #000;
	}

	.tv-map-container {
		flex: 1;
		height: 100%;
		filter: brightness(0.85) contrast(1.1) grayscale(0.3);
	}

	.tv-sidebar {
		width: 460px;
		background: rgba(15, 23, 42, 0.96); /* Dark Slate */
		color: var(--fg-inverted, #fff);
		display: flex;
		flex-direction: column;
		border-left: 2px solid rgba(255, 255, 255, 0.08);
		box-shadow: -10px 0 30px rgba(0,0,0,0.5);
		z-index: 10;
	}

	.tv-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: rgba(15, 23, 42, 1);
	}

	.tv-header h2 { margin: 0; color: #0ea5e9; font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px;}
	.tv-header p { margin: 0; color: #94a3b8; font-size: 0.85rem;}

	.btn-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
		text-decoration: none;
		transition: all 0.2s;
	}
	.btn-back:hover {
		background: #0ea5e9;
		color: #fff;
	}

	.clock {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		text-align: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
	.time { font-size: 2.2rem; font-weight: 700; color: #f8fafc; font-variant-numeric: tabular-nums; }
	.date { color: #94a3b8; font-size: 0.85rem; margin-top: 4px; }

	.live-feed-title {
		padding: 0.85rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.live-feed-title h3 { margin: 0; font-size: 1rem; color: #f8fafc; }

	.feed-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feed-container::-webkit-scrollbar { width: 0px; }

	.feed-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		padding: 0.85rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.feed-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateX(-4px);
		border-color: #0ea5e9;
	}

	.feed-time {
		font-size: 1.1rem;
		font-weight: bold;
		color: #0ea5e9;
		padding-right: 0.75rem;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
		min-width: 55px;
		text-align: center;
	}

	.feed-content { flex: 1; }
	
	.feed-action .btn-map {
		background: rgba(14, 165, 233, 0.1);
		border: 1px solid rgba(14, 165, 233, 0.3);
		color: #0ea5e9;
		font-size: 1.3rem;
		width: 36px; height: 36px;
		border-radius: 50%;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: all 0.2s;
	}
	.feed-card:hover .btn-map {
		background: #0ea5e9; color: #fff;
	}

	@media (max-width: 900px) {
		.tv-layout {
			flex-direction: column;
		}
		.tv-map-container {
			flex: 1;
			min-height: 40vh;
		}
		.tv-sidebar {
			width: 100%;
			flex: 1.5;
			border-left: none;
			border-top: 2px solid rgba(255, 255, 255, 0.08);
		}
		.tv-header {
			padding: 1rem;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
		.clock {
			padding: 0.5rem;
		}
		.time { font-size: 1.5rem; }
		.date { display: none; }
	}
</style>
