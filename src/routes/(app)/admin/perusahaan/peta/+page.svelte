<script>
	import { onMount, onDestroy } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';

	let L;
	let map;
	let marker;
	let perusahaans = $state([]);
	let loading = $state(true);
	let selectedPerusahaan = $state(null);
	let filterMode = $state('all'); // 'all', 'empty_coords'

	onMount(async () => {
		// Import Leaflet dynamically (client-side only)
		L = await import('leaflet');
		
		await loadData();

		// Initialize Map
		map = L.map('map').setView([-7.4704, 110.2177], 13); // Default to Magelang

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);

		// Handle map click
		map.on('click', function(e) {
			if (!selectedPerusahaan) {
				toast.error('Pilih perusahaan terlebih dahulu di sebelah kiri');
				return;
			}
			
			const { lat, lng } = e.latlng;
			setMarker(lat, lng);
			
			// Update local state temporarily
			selectedPerusahaan.lat = lat;
			selectedPerusahaan.lng = lng;
		});
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	async function loadData() {
		loading = true;
		const { data } = await supabase.from('perusahaan').select('*').order('nama');
		if (data) perusahaans = data;
		loading = false;
	}

	function setMarker(lat, lng) {
		if (marker) map.removeLayer(marker);
		
		// Custom icon fix for Leaflet in SvelteKit
		const icon = L.icon({
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41]
		});

		marker = L.marker([lat, lng], { icon }).addTo(map);
	}

	function selectPerusahaan(p) {
		selectedPerusahaan = p;
		if (p.lat && p.lng) {
			setMarker(p.lat, p.lng);
			map.flyTo([p.lat, p.lng], 16);
		} else {
			if (marker) map.removeLayer(marker);
			toast.info('Titik belum diset. Silakan klik pada peta.');
		}
	}

	async function saveCoordinates() {
		if (!selectedPerusahaan || !selectedPerusahaan.lat || !selectedPerusahaan.lng) return;

		const { error } = await supabase
			.from('perusahaan')
			.update({ lat: selectedPerusahaan.lat, lng: selectedPerusahaan.lng })
			.eq('id', selectedPerusahaan.id);

		if (error) {
			toast.error('Gagal menyimpan koordinat');
		} else {
			toast.success('Koordinat berhasil disimpan');
			await loadData();
			// Re-select to keep highlighting
			selectedPerusahaan = perusahaans.find(x => x.id === selectedPerusahaan.id);
		}
	}

	let filteredPerusahaans = $derived(
		filterMode === 'empty_coords' 
			? perusahaans.filter(p => !p.lat || !p.lng) 
			: perusahaans
	);
</script>

<svelte:head>
	<title>Titik Peta PKL | SiPKL Admin</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
	<div>
		<h1>Manajemen Titik Lokasi PKL</h1>
		<p>Klik daftar perusahaan, lalu klik peta untuk menitikkan kordinat akurat</p>
	</div>
	<Button variant="ghost" href="/admin/perusahaan">Kembali ke Daftar</Button>
</div>

<div class="layout-split">
	<!-- Panel Kiri: Daftar Perusahaan -->
	<div class="card panel-list">
		<div class="filter-controls" style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
			<Button variant={filterMode === 'all' ? 'primary' : 'outline'} size="sm" onclick={() => filterMode = 'all'}>Semua</Button>
			<Button variant={filterMode === 'empty_coords' ? 'primary' : 'outline'} size="sm" onclick={() => filterMode = 'empty_coords'}>Belum Ada Titik</Button>
		</div>

		<div class="list-container">
			{#if loading}
				<div class="text-center" style="padding: 2rem;"><div class="spinner"></div></div>
			{:else if filteredPerusahaans.length === 0}
				<div class="text-center text-muted" style="padding: 2rem;">Tidak ada data.</div>
			{:else}
				{#each filteredPerusahaans as p}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="list-item {selectedPerusahaan?.id === p.id ? 'active' : ''}" onclick={() => selectPerusahaan(p)}>
						<div class="header">
							<strong>{p.nama}</strong>
							{#if p.lat && p.lng}
								<span class="badge badge-success" style="font-size: 0.7rem;">OK</span>
							{:else}
								<span class="badge badge-danger" style="font-size: 0.7rem;">KOSONG</span>
							{/if}
						</div>
						<small class="text-muted">{p.alamat}</small>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Panel Kanan: Peta -->
	<div class="card panel-map" style="padding: 0; display: flex; flex-direction: column;">
		{#if selectedPerusahaan}
			<div class="map-toolbar" style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-color);">
				<div>
					<h3 style="margin: 0; font-size: 1.1rem;">{selectedPerusahaan.nama}</h3>
					{#if selectedPerusahaan.lat && selectedPerusahaan.lng}
						<code class="text-xs">{selectedPerusahaan.lat}, {selectedPerusahaan.lng}</code>
					{:else}
						<span class="text-muted text-sm">Klik peta untuk menetapkan lokasi</span>
					{/if}
				</div>
				<Button variant="primary" onclick={saveCoordinates} disabled={!selectedPerusahaan.lat || !selectedPerusahaan.lng}>
					💾 Simpan Koordinat
				</Button>
			</div>
		{/if}
		
		<div id="map" style="flex: 1; min-height: 500px; width: 100%; z-index: 1;"></div>
	</div>
</div>

<style>
	.layout-split {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 1.5rem;
		height: calc(100vh - 200px);
		min-height: 600px;
	}

	.panel-list {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.list-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.list-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.list-item:hover {
		border-color: var(--primary-color);
		background: rgba(var(--primary-rgb), 0.05);
	}

	.list-item.active {
		border-color: var(--primary-color);
		background: rgba(var(--primary-rgb), 0.1);
		box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
	}

	.list-item .header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.25rem;
	}

	@media (max-width: 768px) {
		.layout-split {
			grid-template-columns: 1fr;
			height: auto;
		}
		
		.panel-list {
			max-height: 400px;
		}
		
		.panel-map {
			min-height: 500px;
		}
	}
</style>
