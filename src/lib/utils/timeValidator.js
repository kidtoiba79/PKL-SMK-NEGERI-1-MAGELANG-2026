/**
 * Validasi apakah jam sekarang diizinkan untuk melakukan absensi.
 * Aturan Dikonfirmasi:
 * - Masuk: 06:00 - 09:59 (dibaca <= 9)
 * - Pulang: 14:00 - 18:59 (dibaca <= 18)
 * 
 * @param {'hadir' | 'pulang'} type 
 * @returns {{ valid: boolean, message: string }}
 */
export function validateAttendanceTime(type) {
    const now = new Date();
    const hours = now.getHours();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Rentang jam masuk 06:00 - 09:59
    if (type === 'hadir') {
        if (hours >= 6 && hours <= 9) {
            return { valid: true, message: '' };
        }
        return { 
            valid: false, 
            message: `Saat ini jam ${timeStr}. Absen Masuk hanya diizinkan antara 06:00 - 09:59.` 
        };
    }

    // Rentang jam pulang 14:00 - 18:59
    if (type === 'pulang') {
        if (hours >= 14 && hours <= 18) {
            return { valid: true, message: '' };
        }
        return { 
            valid: false, 
            message: `Saat ini jam ${timeStr}. Absen Pulang hanya diizinkan antara 14:00 - 18:59.` 
        };
    }
    
    return { valid: true, message: '' };
}
