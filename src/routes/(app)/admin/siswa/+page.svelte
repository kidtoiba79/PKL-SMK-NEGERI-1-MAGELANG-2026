<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { exportToExcel, importFromExcel, SISWA_TEMPLATE } from '$lib/excelHelper.js';
	import { geocodeAddress } from '$lib/geocoder.js';
	import Button from '$lib/components/Button.svelte';

	let siswas = $state([]);
	let loading = $state(true);
	let importing = $state(false);
	let fileInput;

	async function loadData() {
		loading = true;
		if ($auth.profile?.role === 'admin') {
			const { data, error } = await supabase
				.from('siswa')
				.select(`
					*,
					penempatan (
						perusahaan ( nama, alamat ),
						pembimbing_industri ( nama, no_telp ),
						guru_pembimbing ( nama )
					)
				`)
				.order('kelas')
				.order('nama');
			if (data) siswas = data;
			if (error) console.error(error);
		}
		loading = false;
	}

	onMount(() => {
		loadData();
	});

	function handleDownloadTemplate() {
		exportToExcel(SISWA_TEMPLATE, 'template_siswa_lengkap.xlsx');
		toast.success('Template berhasil didownload');
	}

	function handleExport() {
		if (siswas.length === 0) {
			toast.error('Tidak ada data untuk diexport');
			return;
		}
		
		const exportData = siswas.map(s => {
			const activePenempatan = s.penempatan && s.penempatan.length > 0 ? s.penempatan[0] : null;
			return {
				'NIS': s.nis,
				'Email Login': `${s.nis}@siswa.smkn1magelang.sch.id`,
				'Nama Lengkap': s.nama,
				'Kelas': s.kelas,
				'Jurusan': s.jurusan,
				'Jenis Kelamin': s.jenis_kelamin || '',
				'Alamat': s.alamat || '',
				'Nama Orang Tua': s.nama_orang_tua || '',
				'No Telp': s.no_telp || '',
				'Tempat PKL': activePenempatan?.perusahaan?.nama || '',
				'Alamat PKL': activePenempatan?.perusahaan?.alamat || '',
				'Nama Pembimbing Industri': activePenempatan?.pembimbing_industri?.nama || '',
				'No Telp Pembimbing': activePenempatan?.pembimbing_industri?.no_telp || '',
				'Nama Guru Pembimbing': activePenempatan?.guru_pembimbing?.nama || ''
			};
		});
		
		exportToExcel(exportData, 'data_siswa_dan_pkl.xlsx');
		toast.success('Data berhasil diexport');
	}

	async function handleFileChange(event) {
		const file = event.target.files[0];
		if (!file) return;

		importing = true;
		try {
			const rawData = await importFromExcel(file);
			
			// 1. Dapatkan Periode PKL Aktif
			const { data: periodeData } = await supabase.from('periode_pkl').select('id').eq('is_active', true).single();
			if (!periodeData) throw new Error("Tidak ada Periode PKL yang aktif. Buat/Aktifkan periode terlebih dahulu di menu Periode.");
			const activePeriodeId = periodeData.id;

			let validRows = rawData.filter(row => row['NIS'] && (row['Nama Lengkap'] || row['Nama Siswa']));
			if (validRows.length === 0) throw new Error("Format data tidak sesuai (NIS dan Nama wajib diisi).");

			toast.success(`Memproses ${validRows.length} baris data... Mohon tunggu.`);

			// Loop data dan insert/get satu per satu untuk memastikan relasi aman
			for (const row of validRows) {
				const namaPkl = row['Tempat PKL']?.trim();
				let perusahaanId = null;
				let pembimbingId = null;

				// A. Handle Perusahaan
				if (namaPkl) {
					// Cari perusahaan
					let { data: existingPerusahaan } = await supabase.from('perusahaan').select('id').ilike('nama', namaPkl).maybeSingle();
					if (existingPerusahaan) {
						perusahaanId = existingPerusahaan.id;
					} else {
						// Buat baru (dengan auto-geocoding)
						const alamatPkl = row['Alamat PKL'] || 'Belum diisi';
						let lat = null, lng = null;
						
						// Coba geocode jika ada alamat
						if (alamatPkl !== 'Belum diisi') {
							const coords = await geocodeAddress(alamatPkl);
							if (coords) {
								lat = coords.lat;
								lng = coords.lng;
							}
						}

						const { data: newPerusahaan, error: errP } = await supabase.from('perusahaan')
							.insert([{ 
								nama: namaPkl, 
								alamat: alamatPkl,
								lat: lat,
								lng: lng
							}]).select('id').single();
						if (errP) console.error("Gagal buat perusahaan", errP);
						else perusahaanId = newPerusahaan.id;
					}
				}

				// B. Handle Pembimbing Industri (DUDI)
				const namaPembimbingDudi = (row['Nama Pembimbing Industri'] || row['Nama Pembimbing'])?.trim();
				if (namaPembimbingDudi && perusahaanId) {
					let { data: existingPemb } = await supabase.from('pembimbing_industri').select('id')
						.eq('perusahaan_id', perusahaanId).ilike('nama', namaPembimbingDudi).maybeSingle();
					
					if (existingPemb) {
						pembimbingId = existingPemb.id;
					} else {
						const { data: newPemb, error: errPemb } = await supabase.from('pembimbing_industri')
							.insert([{ 
								nama: namaPembimbingDudi, 
								perusahaan_id: perusahaanId,
								jabatan: 'Pembimbing Lapangan',
								no_telp: String(row['No Telp Pembimbing'] || '')
							}]).select('id').single();
						if (errPemb) console.error("Gagal buat pembimbing industri", errPemb);
						else pembimbingId = newPemb.id;
					}
				}

				// B2. Handle Guru Pembimbing
				const namaGuru = row['Nama Guru Pembimbing']?.trim();
				let guruId = null;
				if (namaGuru) {
					let { data: existingGuru } = await supabase.from('guru_pembimbing').select('id')
						.ilike('nama', namaGuru).maybeSingle();
					
					if (existingGuru) {
						guruId = existingGuru.id;
					} else {
						// Buat guru baru (nanti bisa dilengkapi NIP-nya dari menu Guru)
						const { data: newGuru, error: errG } = await supabase.from('guru_pembimbing')
							.insert([{ nama: namaGuru }]).select('id').single();
						if (errG) console.error("Gagal buat guru", errG);
						else guruId = newGuru.id;
					}
				}

				// C. Handle Siswa
				const nis = String(row['NIS']).trim();
				let siswaId = null;
				
				const siswaPayload = {
					nis: nis,
					nama: row['Nama Lengkap'] || row['Nama Siswa'] || '',
					kelas: row['Kelas'] || '',
					jurusan: row['Jurusan'] || '',
					jenis_kelamin: row['Jenis Kelamin'] || null,
					alamat: row['Alamat'] || null,
					nama_orang_tua: row['Nama Orang Tua'] || null,
					no_telp: String(row['No Telp'] || '') || null
				};

				const { data: upsertedSiswa, error: errS } = await supabase.from('siswa')
					.upsert([siswaPayload], { onConflict: 'nis' }).select('id').single();
				
				if (errS) {
					console.error(`Gagal upsert siswa ${nis}`, errS);
					continue;
				}
				siswaId = upsertedSiswa.id;

				// D. Handle Penempatan (hanya jika ada perusahaan)
				if (siswaId && perusahaanId) {
					const penempatanPayload = {
						siswa_id: siswaId,
						periode_id: activePeriodeId,
						perusahaan_id: perusahaanId,
						dudi_id: pembimbingId,
						guru_id: guruId  // Guru Pembimbing
					};
					await supabase.from('penempatan').upsert([penempatanPayload], { onConflict: 'siswa_id, periode_id' });
				} else if (siswaId && guruId) {
					// Jika ada guru tapi tidak ada perusahaan, update guru di penempatan yang sudah ada
					await supabase.from('penempatan')
						.update({ guru_id: guruId })
						.eq('siswa_id', siswaId)
						.eq('periode_id', activePeriodeId);
				}
			}
			
		toast.success(`Import selesai! Halaman akan direfresh.`);
		await loadData();
	} catch (error) {
		console.error(error);
		toast.error('Gagal memproses file Excel: ' + (error.message || 'Unknown error'));
	} finally {
		importing = false;
		if (fileInput) fileInput.value = ''; // Reset input
	}
}

let generatingAkun = $state(false);

async function handleGenerateAkun() {
	generatingAkun = true;
	toast.success('Sedang membuat akun siswa... Mohon tunggu.');
	try {
		const res = await fetch('/api/admin/generate-akun', { method: 'POST' });
		const result = await res.json();
		if (result.success) {
			toast.success(result.message);
			if (result.errors?.length > 0) {
				console.warn('Errors:', result.errors);
			}
		} else {
			toast.error('Gagal: ' + result.message);
		}
	} catch (e) {
		toast.error('Gagal menghubungi server.');
	} finally {
		generatingAkun = false;
	}
}
</script>

<svelte:head>
	<title>Data Siswa | SiPKL Admin</title>
</svelte:head>

<div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
	<h1>Master Data Siswa</h1>
	<div class="actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="ghost" size="sm" onclick={handleDownloadTemplate}>📄 Download Template</Button>
		
		<input type="file" accept=".xlsx, .xls" style="display: none;" bind:this={fileInput} onchange={handleFileChange} />
		<Button variant="secondary" size="sm" onclick={() => fileInput.click()} disabled={importing}>
			{importing ? 'Mengimport...' : '⬆️ Import Excel'}
		</Button>
		
		<Button variant="primary" size="sm" onclick={handleExport}>⬇️ Export Excel</Button>
		<Button variant="primary" size="sm" style="background: #7c3aed;" onclick={handleGenerateAkun} disabled={generatingAkun}>
			{generatingAkun ? '⏳ Membuat Akun...' : '🔑 Generate Akun Siswa'}
		</Button>
	</div>
</div>

<div class="card">
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>NIS & Email</th>
					<th>Nama Siswa</th>
					<th>Kelas & Jurusan</th>
					<th>Orang Tua & Kontak</th>
					<th>Tempat PKL</th>
					<th>Pembimbing Industri</th>
					<th>Guru Pembimbing</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr><td colspan="7" class="text-center"><div class="spinner" style="margin: 0 auto;"></div></td></tr>
				{:else if siswas.length > 0}
					{#each siswas as s}
						{@const pkl = s.penempatan && s.penempatan.length > 0 ? s.penempatan[0] : null}
						<tr>
							<td>
								<strong>{s.nis}</strong><br/>
								<small class="text-muted" style="user-select: all; cursor: pointer;" title="Copy Email Login">
									{s.nis}@siswa.smkn1magelang.sch.id
								</small>
							</td>
							<td>
								<strong>{s.nama}</strong><br/>
								<small class="text-muted">{s.jenis_kelamin === 'L' ? 'Laki-laki' : s.jenis_kelamin === 'P' ? 'Perempuan' : ''}</small>
							</td>
							<td>
								{s.kelas}<br/>
								<small class="text-muted">{s.jurusan}</small>
							</td>
							<td>
								{s.nama_orang_tua || '-'}<br/>
								<small class="text-muted">{s.no_telp || '-'}</small>
							</td>
							<td>
								{#if pkl?.perusahaan?.nama}
									<span class="badge badge-primary">{pkl.perusahaan.nama}</span>
								{:else}
									<span class="text-muted">-</span>
								{/if}
							</td>
							<td>{pkl?.pembimbing_industri?.nama || '-'}</td>
							<td>{pkl?.guru_pembimbing?.nama || '-'}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="7" class="text-center text-muted" style="padding: var(--space-xl) 0;">Data kosong. Silakan Import Excel.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
