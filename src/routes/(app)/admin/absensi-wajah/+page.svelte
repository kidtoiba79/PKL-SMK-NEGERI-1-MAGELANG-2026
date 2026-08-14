<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import Button from '$lib/components/Button.svelte';
	import FaceCamera from '$lib/components/FaceCamera.svelte';
	import { loadFaceApi, captureSingleDescriptor, descriptorToArray } from '$lib/faceAttendance.js';

	let loadingData = $state(true);
	let siswas = $state([]);
	let profiles = $state([]);
	
	let selectedSiswaId = $state('');
	let isFaceApiLoaded = $state(false);
	let isProcessingFace = $state(false);
	let statusMsg = $state('');

	onMount(async () => {
		if ($auth.profile?.role === 'admin') {
			await fetchSiswaDanProfil();
			loadFaceAPI();
		}
	});

	async function fetchSiswaDanProfil() {
		loadingData = true;
		
		const pSiswa = supabase.from('siswa').select('id, nis, nama, kelas').order('kelas').order('nama');
		const pProfil = supabase.from('face_profiles').select('reference_id, sample_count').eq('is_active', true);

		const [resSiswa, resProfil] = await Promise.all([pSiswa, pProfil]);

		if (resSiswa.data) siswas = resSiswa.data;
		if (resProfil.data) profiles = resProfil.data;

		loadingData = false;
	}

	async function loadFaceAPI() {
		try {
			statusMsg = 'Memuat model AI Wajah...';
			await loadFaceApi(msg => { statusMsg = msg; });
			isFaceApiLoaded = true;
			statusMsg = 'Kamera siap digunakan.';
		} catch (error) {
			toast.error('Gagal memuat AI: ' + error.message);
			statusMsg = 'Gagal memuat model.';
		}
	}

	// Helper mengecek apakah siswa sudah direkam wajahnya
	function getSampleCount(siswaId) {
		const prof = profiles.find(p => p.reference_id === siswaId);
		return prof ? prof.sample_count : 0;
	}

	async function handleFaceCapture(canvasElement) {
		if (!selectedSiswaId) {
			toast.error('Silakan pilih Siswa terlebih dahulu sebelum memindai wajah.');
			return;
		}

		isProcessingFace = true;
		statusMsg = 'Mengekstrak ciri wajah (descriptor)...';

		try {
			// Karena canvas tidak bisa dilempar ke captureSingleDescriptor langsung (butuh video/img),
			// di dalam face-api bisa juga terima canvas
			const descriptor = await captureSingleDescriptor(canvasElement);

			if (!descriptor) {
				toast.error('Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah terlihat jelas.');
				isProcessingFace = false;
				statusMsg = 'Siap.';
				return;
			}

			statusMsg = 'Menyimpan profil wajah ke database...';
			const descriptorArray = descriptorToArray(descriptor);
			const targetSiswa = siswas.find(s => s.id === selectedSiswaId);

			// Cek apakah sudah ada
			const existing = profiles.find(p => p.reference_id === selectedSiswaId);

			if (existing) {
				// Tambah array descriptor baru (Supabase append ke array JSONB)
				const { error } = await supabase.rpc('append_face_descriptor', {
					p_ref_id: selectedSiswaId,
					p_new_descriptor: descriptorArray
				});
				// Karena tidak pakai RPC khusus di schema, mari ambil yg lama lalu update
				const { data: oldData } = await supabase.from('face_profiles').select('descriptors, sample_count').eq('reference_id', selectedSiswaId).single();
				
				if (oldData) {
					const newDescriptors = [...oldData.descriptors, descriptorArray];
					await supabase.from('face_profiles').update({
						descriptors: newDescriptors,
						sample_count: oldData.sample_count + 1
					}).eq('reference_id', selectedSiswaId);
				}
			} else {
				// Insert baru
				const { error } = await supabase.from('face_profiles').insert([{
					label: targetSiswa.nama,
					role_hint: 'siswa',
					reference_id: selectedSiswaId,
					descriptors: [descriptorArray],
					sample_count: 1
				}]);
				if (error) throw error;
			}

			toast.success(`Wajah ${targetSiswa.nama} berhasil direkam!`);
			await fetchSiswaDanProfil(); // refresh status

		} catch (error) {
			toast.error('Terjadi kesalahan: ' + error.message);
		}
		
		isProcessingFace = false;
		statusMsg = 'Kamera siap digunakan.';
	}
</script>

<svelte:head>
	<title>Registrasi Wajah | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Registrasi Wajah Siswa (Face Profiles)</h1>
	<p>Pilih siswa lalu rekam wajahnya untuk digunakan sebagai referensi Absensi AI.</p>
</div>

<div style="display: grid; grid-template-columns: 1fr; gap: var(--space-xl);">
	<!-- Panel Kamera -->
	<div class="card mb-lg" style="text-align: center;">
		<div class="form-group mb-md" style="max-width: 500px; margin: 0 auto; text-align: left;">
			<label class="form-label" for="siswa">Pilih Siswa yang akan Direkam Wajahnya</label>
			<select id="siswa" bind:value={selectedSiswaId} class="select">
				<option value="">-- Pilih Siswa --</option>
				{#each siswas as s}
					<option value={s.id}>[{s.kelas}] {s.nama} ({getSampleCount(s.id)} Sampel)</option>
				{/each}
			</select>
		</div>

		{#if !isFaceApiLoaded}
			<div class="alert alert-info" style="max-width: 500px; margin: 0 auto;">
				<div class="spinner"></div>
				<span style="margin-left: 1rem;">{statusMsg}</span>
			</div>
		{:else}
			<p class="text-sm text-muted mb-md">Pastikan wajah terlihat jelas. Klik tombol <strong>Ambil Foto</strong> di bawah layar kamera.</p>
			<FaceCamera onCapture={handleFaceCapture} {isProcessingFace} />
			<p class="text-xs text-muted" style="margin-top: 1rem;">{statusMsg}</p>
		{/if}
	</div>
</div>
