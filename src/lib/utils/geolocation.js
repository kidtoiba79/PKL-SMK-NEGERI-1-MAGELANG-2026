/**
 * Wrapper Promise untuk navigator.geolocation
 * @param {number} timeoutMs - Max tunggu dalam milisecond (default 10000ms / 10s)
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentPosition(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung di browser HP/Device Anda.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
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
