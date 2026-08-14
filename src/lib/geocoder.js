/**
 * Utility untuk melakukan Geocoding (mengubah alamat teks menjadi kordinat Latitude/Longitude)
 * Menggunakan OpenStreetMap Nominatim API yang gratis.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Mencari kordinat berdasarkan alamat
 * @param {string} address - Alamat teks (contoh: "Magelang, Jawa Tengah")
 * @returns {Promise<{lat: number, lng: number}|null>} - Objek {lat, lng} atau null jika tidak ditemukan
 */
export async function geocodeAddress(address) {
    if (!address || address.trim() === '' || address.trim().toLowerCase() === 'belum diisi') {
        return null;
    }

    try {
        // Encode URL untuk query parameters
        const query = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1'
        });

        // Panggil Nominatim. Catatan: Nominatim mengharuskan User-Agent khusus agar tidak diblokir
        const response = await fetch(`${NOMINATIM_BASE_URL}?${query.toString()}`, {
            headers: {
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'User-Agent': 'SiPKL-SMKN1Magelang/1.0 (info@smkn1magelang.sch.id)'
            }
        });

        if (!response.ok) {
            console.warn(`Geocoding HTTP error! status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            // Berhasil menemukan koordinat
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon) // Nominatim mengembalikan 'lon', kita ubah ke 'lng'
            };
        }
        
        return null; // Tidak ditemukan
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null; // Fallback jika fetch gagal (misal offline)
    }
}
