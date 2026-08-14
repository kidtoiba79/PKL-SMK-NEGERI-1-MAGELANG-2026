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

	// Tab Mode: 'wajah' (Hadir Masuk/Pulang) | 'izin_sakit' (Pengajuan Izin/Sakit)
	let activeTab = $state('wajah');

	// State Presensi Wajah
	let type = $state('hadir'); // hadir | pulang
	let statusMsg = $state('');
	
	// Lokasi state
	let locStatus = $state('checking'); // checking | inside | outside | error
	let locDistance = $state(0);
	let locAccuracy = $state(0);
	let locCoords = $state(null);
	let maxRadius = $state(500);

	// Face API State
	let isFaceApiLoaded = $state(false);
	let isProcessingFace = $state(false);
	let userFaceProfile = $state(null);

	// State Pengajuan Izin/Sakit
	let izinStatus = $state('izin'); // 'izin' | 'sakit'
	let izinTanggal = $state(new Date().toISOString().split('T')[0]);
	let izinKeterangan = $state('');
	let izinFile = $state(null);
	let isSubmittingIzin = $state(false);

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
			toast.warning('Wajah belum diregistrasi. Untuk absen hadir, hubungi Admin.');
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
			const pos = await getCurrentPosition(15000, 150);
			locCoords = pos;
			locAccuracy = pos.accuracy || 0;
			
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
				statusMsg = 'Wajah tidak terdeteksi. Posisikan wajah di kamera.';
				isProcessingFace = false;
				return;
			}
			if (detections.length > 1) {
				statusMsg = 'Terdeteksi lebih dari 1 wajah. Pastikan hanya Anda di kamera.';
				isProcessingFace = false;
				return;
			}

			const detection = detections[0];
			
			// Liveness Check: Senyum (happy) > 0.6
			if (!detection.expressions.happy || detection.expressions.happy < 0.6) {
				statusMsg = 'Liveness gagal: Silakan SENYUM 😃 ke kamera untuk absen.';
				isProcessingFace = false;
				return;
			}

			// Matching Wajah
			statusMsg = 'Mencocokkan profil...';
			const { match, distance } = matchFace(detection.descriptor, userFaceProfile, 0.45); // threshold 0.45

			if (!match) {
				statusMsg = 'Wajah tidak cocok! (Jarak: ' + distance.toFixed(2) + ')';
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

	async function submitPengajuanIzin(e) {
		e.preventDefault();
		if (!izinKeterangan.trim()) {
			toast.error('Keterangan / alasan wajib diisi.');
			return;
		}

		isSubmittingIzin = true;
		try {
			let suratUrl = null;

			// Upload lampiran surat bukti jika ada
			if (izinFile) {
				const ext = izinFile.name.split('.').pop();
				const fileName = `surat_izin_${$penempatan.data.id}_${Date.now()}.${ext}`;
				const { error: uploadErr } = await supabase.storage
					.from('berkas_pkl')
					.upload(`surat_izin/${fileName}`, izinFile, { upsert: true });

				if (uploadErr) {
					console.warn('Gagal upload surat ke storage:', uploadErr.message);
				} else {
					const { data: publicUrlData } = supabase.storage
						.from('berkas_pkl')
						.getPublicUrl(`surat_izin/${fileName}`);
					suratUrl = publicUrlData.publicUrl;
				}
			}

			const penempatanId = $penempatan.data.id;
			const { data: exist } = await supabase
				.from('absensi_pkl')
				.select('id')
				.eq('penempatan_id', penempatanId)
				.eq('tanggal', izinTanggal)
				.single();

			const payload = {
				penempatan_id: penempatanId,
				tanggal: izinTanggal,
				status: izinStatus,
				keterangan_izin: izinKeterangan.trim(),
				surat_izin_url: suratUrl
			};

			let res;
			if (exist) {
				res = await supabase.from('absensi_pkl').update(payload).eq('id', exist.id);
			} else {
				res = await supabase.from('absensi_pkl').insert([payload]);
			}

			if (res.error) throw res.error;

			toast.success(`Pengajuan ${izinStatus.toUpperCase()} berhasil dikirim!`);
			goto('/siswa');
		} catch (error) {
			toast.error('Gagal mengajukan izin/sakit: ' + error.message);
		} finally {
			isSubmittingIzin = false;
		}
	}
</script>

<svelte:head>
	<title>Presensi & Izin | SiPKL</title>
</svelte:head>

<div class="page-header">
	<h1>Verifikasi Presensi PKL</h1>
	<p>Presensi Wajah Geofence & Pengajuan Izin/Sakit</p>
</div>

<!-- Tab Navigation -->
<div style="display: flex; gap: 0.5rem; margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
	<button 
		class="btn {activeTab === 'wajah' ? 'btn-primary' : 'btn-ghost'}" 
		onclick={() => activeTab = 'wajah'}
	>
		<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
			<path stroke-linecap="round" stroke-linejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		Presensi Hadir (Wajah)
	</button>
	<button 
		class="btn {activeTab === 'izin_sakit' ? 'btn-primary' : 'btn-ghost'}" 
		onclick={() => activeTab = 'izin_sakit'}
	>
		<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.35rem;">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
		Pengajuan Izin / Sakit
	</button>
</div>

{#if activeTab === 'wajah'}
	<div class="card mb-lg" style="text-align: center;">
		<div style="margin-bottom: var(--space-md); display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
			<span class="label-overline">Tipe Presensi:</span>
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
			<LocationBadge status={locStatus} distance={locDistance} {maxRadius} accuracy={locAccuracy} />
			{#if locStatus === 'error' || locStatus === 'outside'}
				<div style="margin-top: 0.5rem;">
					<Button variant="ghost" size="sm" onclick={checkLocation}>Cek Ulang Lokasi GPS</Button>
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
{:else}
	<!-- Form Pengajuan Izin / Sakit -->
	<div class="card mb-lg">
		<h3 style="margin-bottom: var(--space-md);">Formulir Pengajuan Izin / Sakit</h3>
		<p class="text-muted text-sm mb-lg">
			Pengajuan izin/sakit akan langsung tercatat dan dapat diverifikasi oleh Guru Pembimbing serta Pembimbing Industri (DUDI).
		</p>

		<form onsubmit={submitPengajuanIzin}>
			<div class="form-group mb-md">
				<label class="form-label" for="izinStatus">Status Kehadiran *</label>
				<div style="display: flex; gap: 1.5rem; margin-top: 0.25rem;">
					<label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
						<input type="radio" bind:group={izinStatus} value="izin" />
						<span style="font-weight: 600; color: var(--color-izin);">Izin (Keperluan Mendesak)</span>
					</label>
					<label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
						<input type="radio" bind:group={izinStatus} value="sakit" />
						<span style="font-weight: 600; color: var(--color-sakit);">Sakit (Dengan Keterangan)</span>
					</label>
				</div>
			</div>

			<div class="form-group mb-md">
				<label class="form-label" for="izinTanggal">Tanggal Tidak Hadir *</label>
				<input type="date" id="izinTanggal" bind:value={izinTanggal} class="input" required />
			</div>

			<div class="form-group mb-md">
				<label class="form-label" for="izinKeterangan">Alasan / Keterangan *</label>
				<textarea 
					id="izinKeterangan" 
					bind:value={izinKeterangan} 
					class="textarea" 
					rows="3" 
					placeholder="Jelaskan alasan detail mengapa Anda izin atau sakit..." 
					required
				></textarea>
			</div>

			<div class="form-group mb-lg">
				<label class="form-label" for="izinFile">Lampirkan Bukti Foto Surat / Keterangan (Opsional)</label>
				<input 
					type="file" 
					id="izinFile" 
					accept="image/*,application/pdf" 
					class="input"
					onchange={(e) => izinFile = e.target.files[0]} 
				/>
				<span class="text-xs text-muted" style="margin-top: 0.25rem; display: block;">
					Format: JPG, PNG, atau PDF (Surat dokter / surat izin orang tua).
				</span>
			</div>

			<Button type="submit" variant="primary" disabled={isSubmittingIzin}>
				{isSubmittingIzin ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Izin / Sakit'}
			</Button>
		</form>
	</div>
{/if}
