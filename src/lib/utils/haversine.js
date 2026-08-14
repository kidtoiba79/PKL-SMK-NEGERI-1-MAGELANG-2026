/**
 * Menghitung jarak antara 2 titik koordinat bumi menggunakan fungsi Haversine.
 * @param {number} lat1 Latitude titik 1 (Device user)
 * @param {number} lon1 Longitude titik 1 (Device user)
 * @param {number} lat2 Latitude titik 2 (Perusahaan)
 * @param {number} lon2 Longitude titik 2 (Perusahaan)
 * @returns {number} Jarak dalam satuan Meter (m)
 */
export function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

    const R = 6371e3; // Radius bumi dalam meter
    const toRad = Math.PI / 180;
    const φ1 = lat1 * toRad;
    const φ2 = lat2 * toRad;
    const Δφ = (lat2 - lat1) * toRad;
    const Δλ = (lon2 - lon1) * toRad;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // return integer (meter)
}
