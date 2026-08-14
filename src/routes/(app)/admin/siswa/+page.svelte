<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import { toast } from '$lib/stores/toast.js';
	import { exportToExcel, importFromExcel, SISWA_TEMPLATE } from '$lib/excelHelper.js';
	import { geocodeAddress } from '$lib/geocoder.js';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let siswas = $state([]);
	let filteredSiswas = $state([]);
	let loading = $state(true);
	let importing = $state(false);
	let fileInput;

	// Search & Filter
	let searchQuery = $state('');
	let filterKelas = $state('all');
	let filterJurusan = $state('all');

	// Master Options for Relations
	let perusahaans = $state([]);
	let gurus = $state([]);
	let activePeriodeId = $state(null);

	// Modal CRUD State
	let showModalForm = $state(false);
	let showDeleteConfirm = $state(false);
	let isEditing = $state(false);
	let isSubmitting = $state(false);
	let selectedSiswa = $state(null);

	let formData = $state({
		id: null,
		nis: '',
		nama: '',
		kelas: '',
		jurusan: '',
		perusahaan_id: '',
		guru_id: ''
	});

	let generatingAkun = $state(false);

	onMount(async () => {
		await Promise.all([
			loadData(),
			loadMasterOptions()
		]);
	});

	async function loadMasterOptions() {
		const [resPeru, resGuru, resPeriode] = await Promise.all([
			supabase.from('perusahaan').select('id, nama').order('nama'),
			supabase.from('guru_pembimbing').select('id, nama').order('nama'),
			supabase.from('periode_pkl').select('id').eq('is_active', true).maybeSingle()
		]);

		if (resPeru.data) perusahaans = resPeru.data;
		if (resGuru.data) gurus = resGuru.data;
		if (resPeriode.data) activePeriodeId = resPeriode.data.id;
	}

	async function loadData() {
		loading = true;
		if ($auth.profile?.role === 'admin') {
			const { data, error } = await supabase
				.from('siswa')
				.select(`
					*,
					penempatan (
						id,
						perusahaan_id,
						guru_id,
						perusahaan ( id, nama, alamat ),
						pembimbing_industri ( nama, jabatan ),
						guru_pembimbing ( id, nama )
					)
				`)
				.order('kelas')
				.order('nama');
				
			if (data) {
				siswas = data;
				applyFilters();
			}
			if (error) console.error(error);
		}
		loading = false;
	}

	function applyFilters() {
		let result = [...siswas];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(s => 
				s.nama?.toLowerCase().includes(q) ||
				s.nis?.toLowerCase().includes(q) ||
				s.kelas?.toLowerCase().includes(q) ||
				s.jurusan?.toLowerCase().includes(q) ||
				s.penempatan?.[0]?.perusahaan?.nama?.toLowerCase().includes(q)
			);
		}

		if (filterKelas !== 'all') {
			result = result.filter(s => s.kelas === filterKelas);
		}

		if (filterJurusan !== 'all') {
			result = result.filter(s => s.jurusan === filterJurusan);
		}

		filteredSiswas = result;
	}

	// Unique list for filter dropdowns
	let uniqueKelas = $derived.by(() => {
		return [...new Set(siswas.map(s => s.kelas).filter(Boolean))].sort();
	});

	let uniqueJurusan = $derived.by(() => {
		return [...new Set(siswas.map(s => s.jurusan).filter(Boolean))].sort();
	});

	function openCreateModal() {
		isEditing = false;
		formData = {
			id: null,
			nis: '',
			nama: '',
			kelas: '',
			jurusan: '',
			perusahaan_id: '',
			guru_id: ''
		};
		showModalForm = true;
	}

	function openEditModal(siswa) {
		isEditing = true;
		const activePenempatan = siswa.penempatan?.[0];
		formData = {
			id: siswa.id,
			nis: siswa.nis,
			nama: siswa.nama,
			kelas: siswa.kelas,
			jurusan: siswa.jurusan,
			perusahaan_id: activePenempatan?.perusahaan_id || '',
			guru_id: activePenempatan?.guru_id || ''
		};
		showModalForm = true;
	}

	function openDeleteModal(siswa) {
		selectedSiswa = siswa;
		showDeleteConfirm = true;
	}

	async function handleSubmitForm(e) {
		e.preventDefault();
		if (!formData.nis || !formData.nama || !formData.kelas || !formData.jurusan) {
			toast.error('NIS, Nama, Kelas, dan Jurusan wajib diisi.');
			return;
		}

		isSubmitting = true;
		try {
			let siswaId = formData.id;

			const siswaPayload = {
				nis: formData.nis.trim(),
				nama: formData.nama.trim(),
				kelas: formData.kelas.trim(),
				jurusan: formData.jurusan.trim()
			};

			if (isEditing) {
				// UPDATE
				const { error: errUpdate } = await supabase
					.from('siswa')
					.update(siswaPayload)
					.eq('id', siswaId);

				if (errUpdate) throw errUpdate;
			} else {
				// CREATE
				const { data: newSiswa, error: errInsert } = await supabase
					.from('siswa')
					.insert([siswaPayload])
					.select('id')
					.single();

				if (errInsert) throw errInsert;
				siswaId = newSiswa.id;
			}

			// Handle Penempatan (Relasi DUDI & Guru)
			if (activePeriodeId && (formData.perusahaan_id || formData.guru_id)) {
				const { data: existPenempatan } = await supabase
					.from('penempatan')
					.select('id')
					.eq('siswa_id', siswaId)
					.eq('periode_id', activePeriodeId)
					.maybeSingle();

				const penempatanPayload = {
					siswa_id: siswaId,
					periode_id: activePeriodeId,
					perusahaan_id: formData.perusahaan_id || null,
					guru_id: formData.guru_id || null
				};

				if (existPenempatan) {
					if (formData.perusahaan_id) {
						await supabase.from('penempatan').update(penempatanPayload).eq('id', existPenempatan.id);
					} else {
						// Jika perusahaan dikosongkan, update guru saja
						await supabase.from('penempatan').update({ guru_id: formData.guru_id || null }).eq('id', existPenempatan.id);
					}
				} else if (formData.perusahaan_id) {
					await supabase.from('penempatan').insert([penempatanPayload]);
				}
			}

			toast.success(isEditing ? 'Data siswa berhasil diperbarui!' : 'Siswa baru berhasil ditambahkan!');
			showModalForm = false;
			await loadData();
		} catch (error) {
			toast.error('Gagal menyimpan: ' + (error.message || 'Terjadi kesalahan'));
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteSiswa() {
		if (!selectedSiswa) return;
		isSubmitting = true;

		try {
			const { error } = await supabase
				.from('siswa')
				.delete()
				.eq('id', selectedSiswa.id);

			if (error) throw error;

			toast.success(`Siswa ${selectedSiswa.nama} berhasil dihapus.`);
			showDeleteConfirm = false;
			selectedSiswa = null;
			await loadData();
		} catch (error) {
			toast.error('Gagal menghapus siswa: ' + error.message);
		} finally {
			isSubmitting = false;
		}
	}

	function handleDownloadTemplate() {
		exportToExcel(SISWA_TEMPLATE, 'template_siswa_lengkap.xlsx');
		toast.success('Template berhasil didownload');
	}

	function handleExport() {
		if (filteredSiswas.length === 0) {
			toast.error('Tidak ada data untuk diexport');
			return;
		}
		
		const exportData = filteredSiswas.map(s => {
			const activePenempatan = s.penempatan && s.penempatan.length > 0 ? s.penempatan[0] : null;
			return {
				'NIS': s.nis,
				'Email Login': `${s.nis}@siswa.smkn1magelang.sch.id`,
				'Nama Lengkap': s.nama,
				'Kelas': s.kelas,
				'Jurusan': s.jurusan,
				'Tempat PKL': activePenempatan?.perusahaan?.nama || '',
				'Alamat PKL': activePenempatan?.perusahaan?.alamat || '',
				'Nama Pembimbing Industri': activePenempatan?.pembimbing_industri?.nama || '',
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
			
			const { data: periodeData } = await supabase.from('periode_pkl').select('id').eq('is_active', true).maybeSingle();
			if (!periodeData) throw new Error("Tidak ada Periode PKL yang aktif. Buat/Aktifkan periode terlebih dahulu di menu Periode.");
			const activePeriode = periodeData.id;

			let validRows = rawData.filter(row => row['NIS'] && (row['Nama Lengkap'] || row['Nama Siswa']));
			if (validRows.length === 0) throw new Error("Format data tidak sesuai (NIS dan Nama wajib diisi).");

			toast.success(`Memproses ${validRows.length} baris data... Mohon tunggu.`);

			for (const row of validRows) {
				const namaPkl = row['Tempat PKL']?.trim();
				let perusahaanId = null;
				let pembimbingId = null;

				if (namaPkl) {
					let { data: existingPerusahaan } = await supabase.from('perusahaan').select('id').ilike('nama', namaPkl).maybeSingle();
					if (existingPerusahaan) {
						perusahaanId = existingPerusahaan.id;
					} else {
						const alamatPkl = row['Alamat PKL'] || 'Belum diisi';
						let lat = null, lng = null;
						
						if (alamatPkl !== 'Belum diisi') {
							const coords = await geocodeAddress(alamatPkl);
							if (coords) {
								lat = coords.lat;
								lng = coords.lng;
							}
						}

						const { data: newPerusahaan } = await supabase.from('perusahaan')
							.insert([{ nama: namaPkl, alamat: alamatPkl, lat: lat, lng: lng }]).select('id').single();
						if (newPerusahaan) perusahaanId = newPerusahaan.id;
					}
				}

				const namaGuru = row['Nama Guru Pembimbing']?.trim();
				let guruId = null;
				if (namaGuru) {
					let { data: existingGuru } = await supabase.from('guru_pembimbing').select('id').ilike('nama', namaGuru).maybeSingle();
					if (existingGuru) {
						guruId = existingGuru.id;
					} else {
						const { data: newGuru } = await supabase.from('guru_pembimbing').insert([{ nama: namaGuru }]).select('id').single();
						if (newGuru) guruId = newGuru.id;
					}
				}

				const nis = String(row['NIS']).trim();
				const siswaPayload = {
					nis: nis,
					nama: row['Nama Lengkap'] || row['Nama Siswa'] || '',
					kelas: row['Kelas'] || '',
					jurusan: row['Jurusan'] || ''
				};

				const { data: upsertedSiswa, error: errS } = await supabase.from('siswa')
					.upsert([siswaPayload], { onConflict: 'nis' }).select('id').single();
				
				if (errS) continue;
				const sId = upsertedSiswa.id;

				if (sId && perusahaanId) {
					const penempatanPayload = {
						siswa_id: sId,
						periode_id: activePeriode,
						perusahaan_id: perusahaanId,
						dudi_id: pembimbingId,
						guru_id: guruId
					};
					await supabase.from('penempatan').upsert([penempatanPayload], { onConflict: 'siswa_id, periode_id' });
				}
			}
			
			toast.success(`Import selesai! Data berhasil diperbarui.`);
			await loadData();
		} catch (error) {
			console.error(error);
			toast.error('Gagal memproses file Excel: ' + (error.message || 'Unknown error'));
		} finally {
			importing = false;
			if (fileInput) fileInput.value = '';
		}
	}

	async function handleGenerateAkun() {
		generatingAkun = true;
		toast.success('Sedang membuat akun siswa... Mohon tunggu.');
		try {
			const res = await fetch('/api/admin/generate-akun', { method: 'POST' });
			const result = await res.json();
			if (result.success) {
				toast.success(result.message);
				await loadData();
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
	<div>
		<h1>Master Data Siswa</h1>
		<p>Kelola data siswa, plotting penempatan DUDI, dan pembimbing PKL.</p>
	</div>
	<div class="actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button variant="primary" size="sm" onclick={openCreateModal}>
			➕ Tambah Siswa Baru
		</Button>
		<Button variant="ghost" size="sm" onclick={handleDownloadTemplate}>📄 Template</Button>
		<input type="file" accept=".xlsx, .xls" style="display: none;" bind:this={fileInput} onchange={handleFileChange} />
		<Button variant="secondary" size="sm" onclick={() => fileInput.click()} disabled={importing}>
			{importing ? 'Mengimport...' : '⬆️ Import Excel'}
		</Button>
		<Button variant="ghost" size="sm" onclick={handleExport}>⬇️ Export Excel</Button>
		<Button variant="primary" size="sm" style="background: #7c3aed;" onclick={handleGenerateAkun} disabled={generatingAkun}>
			{generatingAkun ? '⏳ Membuat...' : '🔑 Generate Akun'}
		</Button>
	</div>
</div>

<!-- Search & Filters Bar -->
<div class="card mb-lg" style="padding: 1rem 1.5rem;">
	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;">
		<div class="form-group">
			<label class="form-label" for="search">Cari Siswa</label>
			<input 
				type="text" 
				id="search" 
				class="input" 
				placeholder="Ketik Nama / NIS / DUDI..." 
				bind:value={searchQuery}
				oninput={applyFilters}
			/>
		</div>

		<div class="form-group">
			<label class="form-label" for="filterKelas">Filter Kelas</label>
			<select id="filterKelas" class="input" bind:value={filterKelas} onchange={applyFilters}>
				<option value="all">Semua Kelas ({uniqueKelas.length})</option>
				{#each uniqueKelas as k}
					<option value={k}>{k}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label class="form-label" for="filterJurusan">Filter Jurusan</label>
			<select id="filterJurusan" class="input" bind:value={filterJurusan} onchange={applyFilters}>
				<option value="all">Semua Jurusan ({uniqueJurusan.length})</option>
				{#each uniqueJurusan as j}
					<option value={j}>{j}</option>
				{/each}
			</select>
		</div>

		<div style="display: flex; align-items: center; justify-content: flex-end; padding-bottom: 0.25rem;">
			<span class="text-xs text-muted">
				Menampilkan <strong>{filteredSiswas.length}</strong> dari <strong>{siswas.length}</strong> siswa
			</span>
		</div>
	</div>
</div>

<div class="card">
	{#if loading}
		<Skeleton variant="table" rows={6} />
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>NIS & Email Login</th>
						<th>Nama Siswa</th>
						<th>Kelas & Jurusan</th>
						<th>Tempat PKL (DUDI)</th>
						<th>Guru Pembimbing</th>
						<th style="text-align: center; width: 140px;">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredSiswas.length > 0}
						{#each filteredSiswas as s}
							{@const pkl = s.penempatan && s.penempatan.length > 0 ? s.penempatan[0] : null}
							<tr>
								<td>
									<strong>{s.nis}</strong><br/>
									<small class="text-muted" style="user-select: all;" title="Copy Email Login">
										{s.nis}@siswa.smkn1magelang.sch.id
									</small>
								</td>
								<td>
									<strong>{s.nama}</strong><br/>
									{#if s.user_id}
										<span class="badge badge-success" style="font-size: 0.65rem;">Akun Aktif</span>
									{:else}
										<span class="badge badge-warning" style="font-size: 0.65rem;">Belum Ada Akun</span>
									{/if}
								</td>
								<td>
									<strong>{s.kelas}</strong><br/>
									<small class="text-muted">{s.jurusan}</small>
								</td>
								<td>
									{#if pkl?.perusahaan?.nama}
										<span class="badge badge-primary">{pkl.perusahaan.nama}</span>
									{:else}
										<span class="text-muted" style="font-size: 0.8rem;">Belum Ditempatkan</span>
									{/if}
								</td>
								<td>
									{pkl?.guru_pembimbing?.nama || '-'}
								</td>
								<td style="text-align: center;">
									<div style="display: inline-flex; gap: 0.35rem;">
										<Button size="sm" variant="secondary" onclick={() => openEditModal(s)} title="Ubah Data Siswa">
											✏️ Edit
										</Button>
										<Button size="sm" variant="danger" onclick={() => openDeleteModal(s)} title="Hapus Siswa">
											🗑️
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="6" class="text-center text-muted" style="padding: var(--space-xl) 0;">
								{searchQuery || filterKelas !== 'all' || filterJurusan !== 'all' 
									? 'Tidak ada siswa yang cocok dengan filter pencarian.' 
									: 'Belum ada data siswa. Silakan klik Tambah Siswa Baru atau Import Excel.'}
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- MODAL FORM CREATE / EDIT SISWA -->
<Modal 
	show={showModalForm} 
	title={isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'} 
	onclose={() => !isSubmitting && (showModalForm = false)}
>
	<form onsubmit={handleSubmitForm} style="display: flex; flex-direction: column; gap: 1rem;">
		<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem;">
			<div class="form-group">
				<label class="form-label" for="nis">NIS (Nomor Induk) *</label>
				<input type="text" id="nis" class="input" bind:value={formData.nis} required placeholder="Contoh: 12345" />
			</div>
			<div class="form-group">
				<label class="form-label" for="nama">Nama Lengkap Siswa *</label>
				<input type="text" id="nama" class="input" bind:value={formData.nama} required placeholder="Contoh: Ahmad Fauzi" />
			</div>
		</div>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
			<div class="form-group">
				<label class="form-label" for="kelas">Kelas *</label>
				<input type="text" id="kelas" class="input" bind:value={formData.kelas} required placeholder="Contoh: XII RPL 1" />
			</div>
			<div class="form-group">
				<label class="form-label" for="jurusan">Jurusan *</label>
				<input type="text" id="jurusan" class="input" bind:value={formData.jurusan} required placeholder="Contoh: Rekayasa Perangkat Lunak" />
			</div>
		</div>

		<div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
			<h4 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--accent);">Plotting Penempatan PKL (Opsional)</h4>
			
			<div class="form-group mb-md">
				<label class="form-label" for="perusahaan">Tempat PKL (Perusahaan / DUDI)</label>
				<select id="perusahaan" class="input" bind:value={formData.perusahaan_id}>
					<option value="">-- Pilih Perusahaan DUDI --</option>
					{#each perusahaans as p}
						<option value={p.id}>{p.nama}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label class="form-label" for="guru">Guru Pembimbing Sekolah</label>
				<select id="guru" class="input" bind:value={formData.guru_id}>
					<option value="">-- Pilih Guru Pembimbing --</option>
					{#each gurus as g}
						<option value={g.id}>{g.nama}</option>
					{/each}
				</select>
			</div>
		</div>

		<div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
			<Button type="button" variant="ghost" onclick={() => showModalForm = false} disabled={isSubmitting}>Batal</Button>
			<Button type="submit" variant="primary" disabled={isSubmitting}>
				{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Siswa'}
			</Button>
		</div>
	</form>
</Modal>

<!-- MODAL KONFIRMASI HAPUS SISWA -->
<Modal 
	show={showDeleteConfirm} 
	title="Konfirmasi Hapus Siswa" 
	onclose={() => !isSubmitting && (showDeleteConfirm = false)}
>
	<div style="padding: 0.5rem 0;">
		<p>Apakah Anda yakin ingin menghapus data siswa <strong>{selectedSiswa?.nama}</strong> (NIS: {selectedSiswa?.nis})?</p>
		<p class="text-xs text-muted" style="color: var(--color-reject); margin-top: 0.5rem;">
			⚠️ Semua data penempatan, riwayat absensi, dan jurnal milik siswa ini juga akan terhapus secara permanen.
		</p>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showDeleteConfirm = false} disabled={isSubmitting}>Batal</Button>
		<Button variant="danger" onclick={handleDeleteSiswa} disabled={isSubmitting}>
			{isSubmitting ? 'Menghapus...' : 'Ya, Hapus Siswa'}
		</Button>
	{/snippet}
</Modal>
