/**
 * Wrapper Promise untuk navigator.geolocation dengan validasi akurasi & anti-spoofing dasar
 * @param {number} timeoutMs - Max tunggu dalam milisecond (default 10000ms / 10s)
 * @param {number} maxAllowedAccuracy - Batas toleransi error akurasi GPS dalam meter (default 150m)
 * @returns {Promise<{lat: number, lng: number, accuracy: number, isHighAccuracy: boolean}>}
 */
export function getCurrentPosition(timeoutMs = 12000, maxAllowedAccuracy = 150) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung di browser HP/Device Anda.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                // Cek koordinat dasar
                if (latitude === 0 && longitude === 0) {
                    reject(new Error('Koordinat GPS tidak valid (Null Island detected). Pastikan GPS aktif.'));
                    return;
                }

                // Cek akurasi GPS: jika sinyal terlalu bias (> 150 meter), beri peringatan agar user berada di area terbuka
                if (accuracy > maxAllowedAccuracy) {
                    reject(new Error(`Akurasi GPS terlalu rendah (±${Math.round(accuracy)}m). Silakan pindah ke luar ruangan atau aktifkan High Accuracy GPS.`));
                    return;
                }

                resolve({
                    lat: latitude,
                    lng: longitude,
                    accuracy: Math.round(accuracy),
                    isHighAccuracy: accuracy <= 35
                });
            },
            (error) => {
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Akses lokasi (GPS) ditolak. Izinkan akses lokasi di browser untuk melakukan absensi.'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Informasi lokasi GPS tidak tersedia. Coba nyalakan GPS atau pindah ke area terbuka.'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Pengambilan lokasi terlalu lama (timeout). Sinyal GPS mungkin lemah, coba refresh.'));
                        break;
                    default:
                        reject(new Error('Terjadi kesalahan tidak dikenal saat mengambil lokasi GPS.'));
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 0 // selalu minta lokasi terbaru, jangan pakai cache
            }
        );
    });
}
