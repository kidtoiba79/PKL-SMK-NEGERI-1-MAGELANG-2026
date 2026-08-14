import * as XLSX from 'xlsx';

/**
 * Generate dan download file Excel (Template atau Export Data)
 * @param {Array<Object>} data - Array of objects (JSON)
 * @param {String} filename - Nama file (misal: "data_siswa.xlsx")
 */
export function exportToExcel(data, filename) {
	// Buat workbook baru
	const wb = XLSX.utils.book_new();
	// Konversi JSON ke worksheet
	const ws = XLSX.utils.json_to_sheet(data);
	// Tambahkan worksheet ke workbook
	XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
	// Download file
	XLSX.writeFile(wb, filename);
}

/**
 * Parse file Excel menjadi Array of Objects (JSON)
 * @param {File} file - Objek file dari input type="file"
 * @returns {Promise<Array<Object>>} - Data hasil parsing
 */
export function importFromExcel(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target.result);
				const workbook = XLSX.read(data, { type: 'array' });
				// Ambil sheet pertama
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				// Konversi sheet ke JSON
				const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' }); // defval: '' agar cell kosong jadi string kosong
				resolve(json);
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = (error) => {
			reject(error);
		};

		reader.readAsArrayBuffer(file);
	});
}

/**
 * Template baku untuk master data siswa
 */
export const SISWA_TEMPLATE = [
	{
		NIS: '12345',
		'Nama Lengkap': 'Budi Santoso',
		Kelas: 'XI RPL 1',
		Jurusan: 'Rekayasa Perangkat Lunak',
		'Jenis Kelamin': 'L',
		Alamat: 'Jl. Merdeka No. 1, Magelang',
		'Nama Orang Tua': 'Agus Santoso',
		'No Telp': '08123456789',
		'Tempat PKL': 'PT. Antigravity Indonesia',
		'Alamat PKL': 'Magelang, Jawa Tengah',
		'Nama Pembimbing Industri': 'Bapak Joko',
		'No Telp Pembimbing': '085555555',
		'Nama Guru Pembimbing': 'Pak Budi (Guru SMK)'
	},
	{
		NIS: '12346',
		'Nama Lengkap': 'Siti Aminah',
		Kelas: 'XI RPL 1',
		Jurusan: 'Rekayasa Perangkat Lunak',
		'Jenis Kelamin': 'P',
		Alamat: 'Jl. Pemuda No. 10, Magelang',
		'Nama Orang Tua': 'Bambang',
		'No Telp': '08987654321',
		'Tempat PKL': 'CV. Maju Jaya',
		'Alamat PKL': 'Yogyakarta',
		'Nama Pembimbing Industri': 'Ibu Ratna',
		'No Telp Pembimbing': '086666666',
		'Nama Guru Pembimbing': 'Pak Budi (Guru SMK)'
	}
];
