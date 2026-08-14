<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import { penempatan } from '$lib/stores/penempatan.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	
	import Button from '$lib/components/Button.svelte';
	import LocationBadge from '$lib/components/LocationBadge.svelte';
	import FaceCamera from '$lib/components/FaceCamera.svelte';
	
	import { getCurrentPosition } from '$lib/utils/geolocation.js';
	import { getDistance } from '$lib/utils/haversine.js';
	import { validateAttendanceTime } from '$lib/utils/timeValidator.js';
	import { loadFaceApi, detectFaces, matchFace } from '$lib/faceAttendance.js';

	let type = $state('hadir'); // hadir | pulang
	let statusMsg = $state('');
	
	// Lokasi state
	let locStatus = $state('checking'); // checking | inside | outside | error
	let locDistance = $state(0);
	let locCoords = $state(null);
	let maxRadius = $state(500);

	// Face API State
	let isFaceApiLoaded = $state(false);
	let isProcessingFace = $state(false);
	let userFaceProfile = $state(null);

	onMount(async () => {
		if (!$penempatan.data && $auth.profile?.siswa_id) {
			await penempatan.fetchSiswaPenempatan($auth.profile.siswa_id);
		}

		if (!$penempatan.data) {
			toast.error('Data penempatan tidak ditemukan.');
			goto('/siswa');
			return;
		}

		maxRadius = $penempatan.data.perusahaan.radius_meter || 500;
		checkLocation();
		loadFaceAPI();
		fetchUserProfile();
	});

	async function fetchUserProfile() {
		const { data, error } = await supabase
			.from('face_profiles')
			.select('label, descriptors')
			.eq('reference_id', $auth.profile.siswa_id)
			.eq('is_active', true)
			.single();
			
		if (data) {
			userFaceProfile = [data]; // dibungkus array sesuai ekspektasi matchFace()
		} else {
			toast.warning('Wajah belum diregistrasi. Anda tidak bisa absen. Hubungi Admin.');
		}
	}

	async function loadFaceAPI() {
		try {
			statusMsg = 'Memuat model AI...';
			await loadFaceApi(msg => { statusMsg = msg; });
			isFaceApiLoaded = true;
			statusMsg = 'Siap.';
		} catch (error) {
			toast.error(error.message);
			statusMsg = 'Gagal memuat AI.';
		}
	}

	async function checkLocation() {
		locStatus = 'checking';
		try {
			const pos = await getCurrentPosition(15000);
			locCoords = pos;
			
			const pLat = $penempatan.data.perusahaan.lat;
			const pLng = $penempatan.data.perusahaan.lng;
			
			if (!pLat || !pLng) {
				throw new Error('Koordinat perusahaan belum di-set. Hubungi admin.');
			}
			
			const dist = getDistance(pos.lat, pos.lng, pLat, pLng);
			locDistance = dist;
			locStatus = dist <= maxRadius ? 'inside' : 'outside';
		} catch (error) {
			locStatus = 'error';
			toast.error(error.message);
		}
	}

	async function handleFaceCapture(canvasElement) {
		if (locStatus !== 'inside') {
			toast.error('Anda berada di luar radius perusahaan!');
			return;
		}

		if (!userFaceProfile) {
			toast.error('Profil wajah belum terdaftar!');
			return;
		}

		const timeCheck = validateAttendanceTime(type);
		if (!timeCheck.valid) {
			toast.error(timeCheck.message);
			return;
		}

		isProcessingFace = true;
		statusMsg = 'Menganalisis wajah...';

		try {
			// Deteksi wajah di canvas
			const detections = await detectFaces(canvasElement);
			
			if (detections.length === 0) {
				toast.error('Wajah tidak terdeteksi. Pastikan pencahayaan cukup.');
				isProcessingFace = false;
				return;
			}
			if (detections.length > 1) {
				toast.error('Terdeteksi lebih dari 1 wajah. Pastikan hanya Anda di kamera.');
				isProcessingFace = false;
				return;
			}

			const detection = detections[0];
			
			// Liveness Check: Senyum (happy) > 0.6
			if (!detection.expressions.happy || detection.expressions.happy < 0.6) {
				toast.warning('Liveness gagal: Silakan SENYUM ke kamera untuk absen.');
				isProcessingFace = false;
				return;
			}

			// Matching Wajah
			statusMsg = 'Mencocokkan profil...';
			const { match, distance } = matchFace(detection.descriptor, userFaceProfile, 0.45); // threshold 0.45 (ketat)

			if (!match) {
				toast.error('Wajah tidak cocok dengan profil Anda! Jarak: ' + distance.toFixed(2));
				isProcessingFace = false;
				return;
			}

			// Sukses, kirim ke server
			await submitAttendance((1 - distance));

		} catch (error) {
			toast.error('Gagal memproses wajah: ' + error.message);
			isProcessingFace = false;
		}
	}

	async function submitAttendance(confidence) {
		statusMsg = 'Menyimpan absensi...';
		
		const today = new Date().toISOString().split('T')[0];
		const penempatanId = $penempatan.data.id;

		try {
			// Cek apakah sudah ada record absensi hari ini
			const { data: exist } = await supabase
				.from('absensi_pkl')
				.select('*')
				.eq('penempatan_id', penempatanId)
				.eq('tanggal', today)
				.single();

			if (type === 'hadir') {
				if (exist?.jam_masuk) {
					toast.info('Anda sudah absen masuk hari ini.');
					goto('/siswa');
					return;
				}
				
				const payload = {
					penempatan_id: penempatanId,
					tanggal: today,
					jam_masuk: new Date().toISOString(),
					lat_masuk: locCoords.lat,
					lng_masuk: locCoords.lng,
					face_confidence_masuk: confidence,
					status: 'hadir'
				};

				let res;
				if (exist) {
					res = await supabase.from('absensi_pkl').update(payload).eq('id', exist.id);
				} else {
					res = await supabase.from('absensi_pkl').insert([payload]);
				}
				
				if (res.error) throw res.error;
				toast.success('Absen MASUK berhasil dicatat!');

			} else if (type === 'pulang') {
				if (!exist || !exist.jam_masuk) {
					toast.error('Anda belum absen masuk hari ini!');
					goto('/siswa');
					return;
				}
				if (exist.jam_pulang) {
					toast.info('Anda sudah absen pulang hari ini.');
					goto('/siswa');
					return;
				}

				const payload = {
					jam_pulang: new Date().toISOString(),
					lat_pulang: locCoords.lat,
					lng_pulang: locCoords.lng,
					face_confidence_pulang: confidence
				};

				const { error } = await supabase.from('absensi_pkl').update(payload).eq('id', exist.id);
				if (error) throw error;
				toast.success('Absen PULANG berhasil dicatat!');
			}
			
			goto('/siswa');
		} catch (error) {
			toast.error('Gagal menyimpan absensi: ' + error.message);
			isProcessingFace = false;
		}
	}
</script>

<svelte:head>
	<title>Absensi Wajah | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Verifikasi Absensi</h1>
	<p>Radius 500m & Pemindaian Wajah Liveness</p>
</div>

<div class="card mb-lg" style="text-align: center;">
	<div style="margin-bottom: var(--space-md); display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
		<span class="label-overline">Tipe Absensi:</span>
		<div style="display: flex; gap: 1rem; justify-content: center;">
			<label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
				<input type="radio" bind:group={type} value="hadir" disabled={isProcessingFace}>
				<span style="font-weight: 600;">Absen Masuk (06:00 - 09:00)</span>
			</label>
			<label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
				<input type="radio" bind:group={type} value="pulang" disabled={isProcessingFace}>
				<span style="font-weight: 600;">Absen Pulang (14:00 - 18:00)</span>
			</label>
		</div>
	</div>

	<div style="margin-bottom: var(--space-md);">
		<LocationBadge status={locStatus} distance={locDistance} {maxRadius} />
		{#if locStatus === 'error' || locStatus === 'outside'}
			<div style="margin-top: 0.5rem;">
				<Button variant="ghost" size="sm" onclick={checkLocation}>Cek Ulang Lokasi</Button>
			</div>
		{/if}
	</div>

	{#if locStatus === 'inside' && userFaceProfile}
		{#if isFaceApiLoaded}
			<p class="text-muted" style="margin-bottom: var(--space-md);">
				<strong class="text-accent">Instruksi:</strong> Posisikan wajah di tengah dan <strong style="text-decoration: underline;">Tersenyum</strong> ke kamera.
			</p>
			<FaceCamera onCapture={handleFaceCapture} {isProcessingFace} />
		{:else}
			<div class="alert alert-info">
				<div class="spinner spinner-lg"></div>
				<span style="margin-left: 1rem;">Memuat AI Wajah... Mohon tunggu.</span>
			</div>
		{/if}
	{:else if locStatus === 'inside' && !userFaceProfile}
		<div class="alert alert-error">
			Anda sudah di radius, tapi profil wajah Anda belum diregistrasi oleh Admin.
		</div>
	{/if}
	
	<p class="text-xs text-muted" style="margin-top: var(--space-md);">{statusMsg}</p>
</div>
