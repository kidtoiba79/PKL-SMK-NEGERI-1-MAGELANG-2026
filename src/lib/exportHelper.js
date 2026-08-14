import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Helper untuk membuat KOP Surat Resmi SMK Negeri 1 Magelang pada dokumen PDF
 * @param {jsPDF} doc
 * @param {string} title
 * @param {string} subtitle
 */
export function addSchoolHeader(doc, title = 'LAPORAN REKAPITULASI PKL', subtitle = 'Tahun Ajaran 2025/2026') {
	const pageWidth = doc.internal.pageSize.getWidth();

	// Nama Instansi / Sekolah
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(30, 41, 59);
	doc.text('PEMERINTAH PROVINSI JAWA TENGAH', pageWidth / 2, 14, { align: 'center' });
	doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 19, { align: 'center' });
	
	doc.setFontSize(13);
	doc.setTextColor(14, 165, 233); // Warna cyan / Sky Blue khas SiPKL
	doc.text('SMK NEGERI 1 MAGELANG', pageWidth / 2, 25, { align: 'center' });
	
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(100, 116, 139);
	doc.text('Jl. Cawang No. 2, Jurangombo Sel., Kec. Magelang Selatan, Kota Magelang, Jawa Tengah 56123', pageWidth / 2, 30, { align: 'center' });
	doc.text('Website: smkn1magelang.sch.id | Sistem Informasi PKL (SiPKL)', pageWidth / 2, 34, { align: 'center' });

	// Garis Ganda Pembatas KOP
	doc.setDrawColor(14, 165, 233);
	doc.setLineWidth(0.8);
	doc.line(14, 38, pageWidth - 14, 38);
	doc.setLineWidth(0.2);
	doc.setDrawColor(148, 163, 184);
	doc.line(14, 39.5, pageWidth - 14, 39.5);

	// Judul Dokumen
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.setTextColor(15, 23, 42);
	doc.text(title.toUpperCase(), pageWidth / 2, 47, { align: 'center' });

	if (subtitle) {
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		doc.setTextColor(100, 116, 139);
		doc.text(subtitle, pageWidth / 2, 52, { align: 'center' });
	}

	return 57; // Y offset berikutnya
}

/**
 * Generate PDF Rekap Presensi Siswa PKL
 */
export function exportAttendancePDF({
	title = 'Rekapitulasi Presensi Siswa PKL',
	subtitle = '',
	data = [],
	meta = {},
	filename = 'rekap_presensi_pkl.pdf'
}) {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const startY = addSchoolHeader(doc, title, subtitle);

	// Meta info section (Guru / DUDI / Tanggal Cetak)
	let currentY = startY;
	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(51, 65, 85);

	if (meta.guruName) {
		doc.text(`Guru Pembimbing : ${meta.guruName}`, 14, currentY);
		currentY += 4.5;
	}
	if (meta.filterDate) {
		doc.text(`Periode / Tanggal: ${meta.filterDate}`, 14, currentY);
		currentY += 4.5;
	}
	doc.text(`Dicetak Pada     : ${new Date().toLocaleString('id-ID')}`, 14, currentY);
	currentY += 6;

	// Table Rows
	const tableBody = data.map((item, index) => {
		const jamMasuk = item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
		const jamPulang = item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
		
		let statusLabel = (item.status || 'Belum Absen').toUpperCase();
		if (item.keterangan_izin) {
			statusLabel += ` (${item.keterangan_izin})`;
		}

		return [
			index + 1,
			item.siswa_nama || '-',
			item.siswa_kelas || '-',
			item.perusahaan_nama || '-',
			jamMasuk,
			jamPulang,
			statusLabel
		];
	});

	autoTable(doc, {
		startY: currentY,
		head: [['No', 'Nama Siswa', 'Kelas', 'Tempat PKL (DUDI)', 'Masuk', 'Pulang', 'Status']],
		body: tableBody,
		theme: 'grid',
		styles: {
			fontSize: 8,
			cellPadding: 2,
			textColor: [30, 41, 59],
			lineColor: [226, 232, 240],
			lineWidth: 0.1
		},
		headStyles: {
			fillColor: [14, 165, 233],
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			halign: 'center'
		},
		columnStyles: {
			0: { halign: 'center', cellWidth: 10 },
			1: { cellWidth: 45 },
			2: { halign: 'center', cellWidth: 22 },
			3: { cellWidth: 45 },
			4: { halign: 'center', cellWidth: 18 },
			5: { halign: 'center', cellWidth: 18 },
			6: { halign: 'center', cellWidth: 26 }
		},
		didDrawPage: (dataPage) => {
			// Footer page number
			const str = `Halaman ${doc.internal.getNumberOfPages()}`;
			doc.setFontSize(8);
			doc.setTextColor(148, 163, 184);
			doc.text(str, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 10);
		}
	});

	// Signature Block
	const finalY = doc.lastAutoTable.finalY + 12;
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	if (finalY < pageHeight - 35) {
		doc.setFontSize(9);
		doc.setTextColor(30, 41, 59);
		doc.text('Magelang, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - 65, finalY);
		doc.text('Guru Pembimbing PKL,', pageWidth - 65, finalY + 5);
		doc.text('( ' + (meta.guruName || '...........................................') + ' )', pageWidth - 65, finalY + 24);
	}

	doc.save(filename);
}

/**
 * Generate PDF Rekap Jurnal Harian Siswa
 */
export function exportJournalPDF({
	title = 'Rekapitulasi Jurnal Kegiatan PKL',
	subtitle = '',
	journals = [],
	meta = {},
	filename = 'rekap_jurnal_pkl.pdf'
}) {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const startY = addSchoolHeader(doc, title, subtitle);

	let currentY = startY;
	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(51, 65, 85);

	if (meta.siswaNama) {
		doc.text(`Nama Siswa : ${meta.siswaNama} (${meta.siswaKelas || '-'})`, 14, currentY);
		currentY += 4.5;
	}
	if (meta.perusahaanNama) {
		doc.text(`Tempat PKL : ${meta.perusahaanNama}`, 14, currentY);
		currentY += 4.5;
	}
	doc.text(`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`, 14, currentY);
	currentY += 6;

	const tableBody = journals.map((j, index) => [
		index + 1,
		new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
		j.deskripsi || '-',
		(j.status_approval || 'pending').toUpperCase(),
		j.catatan_revisi || '-'
	]);

	autoTable(doc, {
		startY: currentY,
		head: [['No', 'Tanggal', 'Deskripsi Aktivitas / Pekerjaan', 'Approval DUDI', 'Catatan Pembimbing']],
		body: tableBody,
		theme: 'grid',
		styles: {
			fontSize: 8,
			cellPadding: 2.5,
			textColor: [30, 41, 59],
			lineColor: [226, 232, 240],
			lineWidth: 0.1
		},
		headStyles: {
			fillColor: [15, 118, 110], // Teal color
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			halign: 'center'
		},
		columnStyles: {
			0: { halign: 'center', cellWidth: 10 },
			1: { halign: 'center', cellWidth: 26 },
			2: { cellWidth: 90 },
			3: { halign: 'center', cellWidth: 26 },
			4: { cellWidth: 32 }
		}
	});

	doc.save(filename);
}

/**
 * Export structured Excel file with column widths and clean headers
 */
export function exportAttendanceExcelDetailed(data = [], filename = 'rekap_presensi.xlsx') {
	const formattedData = data.map((item, index) => ({
		'No': index + 1,
		'NIS': item.siswa_nis || '-',
		'Nama Siswa': item.siswa_nama || '-',
		'Kelas': item.siswa_kelas || '-',
		'Jurusan': item.siswa_jurusan || '-',
		'Tempat PKL (DUDI)': item.perusahaan_nama || '-',
		'Tanggal': item.tanggal || new Date().toISOString().split('T')[0],
		'Jam Masuk': item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString('id-ID') : '-',
		'Jam Pulang': item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString('id-ID') : '-',
		'Status': (item.status || 'Belum Absen').toUpperCase(),
		'Keterangan Izin/Sakit': item.keterangan_izin || '-',
		'Surat Bukti': item.surat_izin_url || '-'
	}));

	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(formattedData);

	// Auto-fit column widths
	const colWidths = [
		{ wch: 5 },  // No
		{ wch: 12 }, // NIS
		{ wch: 28 }, // Nama
		{ wch: 14 }, // Kelas
		{ wch: 25 }, // Jurusan
		{ wch: 30 }, // DUDI
		{ wch: 14 }, // Tanggal
		{ wch: 12 }, // Masuk
		{ wch: 12 }, // Pulang
		{ wch: 14 }, // Status
		{ wch: 30 }, // Keterangan
		{ wch: 35 }  // Surat URL
	];
	ws['!cols'] = colWidths;

	XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');
	XLSX.writeFile(wb, filename);
}
