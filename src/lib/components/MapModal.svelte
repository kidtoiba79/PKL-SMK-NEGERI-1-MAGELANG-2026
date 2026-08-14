<script>
	import { onMount, onDestroy } from 'svelte';
	import Button from './Button.svelte';
	import { haversineDistance } from '$lib/utils/geolocation.js';

	let { absensi, onClose } = $props();

	let L;
	let map;
	let mapElement;
	let jarak = 0;
	let isDalamJangkauan = false;

	onMount(async () => {
		if (!absensi || !absensi.penempatan?.perusahaan) return;

		const perusahaan = absensi.penempatan.perusahaan;
		const studentLat = absensi.lat;
		const studentLng = absensi.lng;
		const perusLat = perusahaan.lat;
		const perusLng = perusahaan.lng;
		const radius = perusahaan.radius_meter || 500;

		// Hitung jarak
		if (studentLat && studentLng && perusLat && perusLng) {
			jarak = haversineDistance(studentLat, studentLng, perusLat, perusLng);
			isDalamJangkauan = jarak <= radius;
		}

		// Import Leaflet
		L = await import('leaflet');
		
		// Inisialisasi Peta
		const centerLat = perusLat || studentLat || -7.4704;
		const centerLng = perusLng || studentLng || 110.2177;
		
		map = L.map(mapElement).setView([centerLat, centerLng], 15);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);

		const iconPerusahaan = L.icon({
			iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		const iconSiswa = L.icon({
			iconUrl: isDalamJangkauan 
				? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
				: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
			shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		// Gambar Titik Perusahaan (Area)
		if (perusLat && perusLng) {
			L.circle([perusLat, perusLng], {
				color: 'blue',
				fillColor: '#3388ff',
				fillOpacity: 0.2,
				radius: radius
			}).addTo(map);

			L.marker([perusLat, perusLng], { icon: iconPerusahaan })
				.addTo(map)
				.bindPopup(`<b>${perusahaan.nama}</b><br/>Area Absensi (Radius ${radius}m)`);
		}

		// Gambar Titik Absen Siswa
		if (studentLat && studentLng) {
			const label = isDalamJangkauan ? 'Valid (Dalam Jangkauan)' : 'Tidak Valid (Luar Jangkauan)';
			L.marker([studentLat, studentLng], { icon: iconSiswa })
				.addTo(map)
				.bindPopup(`<b>Titik Absen Siswa</b><br/>Jarak: ${Math.round(jarak)} meter<br/>Status: ${label}`)
				.openPopup();
		}

		// Fit bounds agar kedua titik terlihat jika jaraknya jauh
		if (studentLat && perusLat && !isDalamJangkauan) {
			const bounds = L.latLngBounds([
				[studentLat, studentLng],
				[perusLat, perusLng]
			]);
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div class="modal-backdrop" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<div>
				<h3>Verifikasi Lokasi Absensi</h3>
				<p class="text-sm text-muted">Siswa: {absensi?.siswa?.nama || 'Unknown'}</p>
			</div>
			<button class="close-btn" onclick={onClose}>&times;</button>
		</div>

		<div class="modal-body">
			{#if absensi?.lat && absensi?.penempatan?.perusahaan?.lat}
				<div class="status-banner {isDalamJangkauan ? 'bg-success' : 'bg-danger'}">
					<div class="status-info">
						<strong>{isDalamJangkauan ? '✅ DALAM JANGKAUAN' : '❌ DI LUAR JANGKAUAN'}</strong>
						<span>Jarak absen dari lokasi DUDI adalah <b>{Math.round(jarak)} meter</b> (Maksimal: {absensi.penempatan.perusahaan.radius_meter || 500}m)</span>
					</div>
				</div>
			{:else}
				<div class="status-banner bg-warning">
					<strong>⚠️ Data Lokasi Tidak Lengkap</strong>
					<span>Pastikan siswa memberikan izin akses lokasi dan DUDI memiliki titik koordinat.</span>
				</div>
			{/if}

			<div bind:this={mapElement} class="map-container"></div>
			
			<div class="legend">
				<div class="legend-item"><span class="dot blue"></span> Pusat DUDI</div>
				<div class="legend-item"><span class="dot green"></span> Absen Siswa (Valid)</div>
				<div class="legend-item"><span class="dot red"></span> Absen Siswa (Tidak Valid)</div>
			</div>
		</div>

		<div class="modal-footer">
			<Button variant="secondary" onclick={onClose}>Tutup Peta</Button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	.modal-content {
		background: var(--bg-color);
		width: 90%;
		max-width: 800px;
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 30px rgba(0,0,0,0.2);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.modal-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.modal-header h3 { margin: 0; }
	.close-btn {
		background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-color);
	}
	.modal-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.status-banner {
		padding: 1rem;
		border-radius: var(--radius-md);
		color: white;
	}
	.bg-success { background: #10b981; }
	.bg-danger { background: #ef4444; }
	.bg-warning { background: #f59e0b; color: #000; }
	.status-info {
		display: flex; flex-direction: column; gap: 0.25rem;
	}
	.map-container {
		width: 100%;
		height: 400px;
		border-radius: var(--radius-md);
		background: #e5e5e5;
		z-index: 1;
	}
	.legend {
		display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem;
	}
	.legend-item { display: flex; align-items: center; gap: 0.5rem; }
	.dot {
		width: 12px; height: 12px; border-radius: 50%; display: inline-block;
	}
	.dot.blue { background: #3388ff; }
	.dot.green { background: #10b981; }
	.dot.red { background: #ef4444; }
	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: flex-end;
		background: rgba(0,0,0,0.02);
	}
</style>
