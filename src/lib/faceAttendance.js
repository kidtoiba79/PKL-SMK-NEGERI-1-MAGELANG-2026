/**
 * faceAttendance.js
 * Utility untuk memuat model face-api.js dan menjalankan
 * face detection + recognition di browser.
 *
 * Semua proses berjalan 100% di browser (tidak ada data
 * biometrik yang dikirim ke server luar).
 */

// face-api.js dimuat dari CDN secara lazy
let faceapi = null;
let modelsLoaded = false;
let loadingPromise = null;

// Path lokal untuk model face-api.js (folder public)
const MODEL_URL = '/face-api/model';

/**
 * Muat library face-api.js dan model-modelnya.
 * Dipanggil sekali; pemanggilan berikutnya langsung resolve.
 * @param {Function} onProgress - callback(message: string)
 */
export const loadFaceApi = async (onProgress = () => {}) => {
    if (modelsLoaded && faceapi) return faceapi;

    // Cegah loading ganda
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            onProgress('Memuat library face-api.js...');

            // Dinamis import dari lokal via script tag dengan fallback
            if (!window.faceapi) {
                const loadScript = (url) => new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                try {
                    // Coba load dari folder js (dengan cache buster)
                    await loadScript('/face-api/js/face-api.js?v=' + Date.now());
                } catch (err) {
                    try {
                        // Fallback jika menggunakan CDN karena lokal gagal
                        await loadScript('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js');
                    } catch (fallbackErr) {
                        throw new Error('Gagal memuat library face-api lokal maupun CDN. Silakan bersihkan cache browser HP Anda (Hard Refresh).');
                    }
                }
            }

            faceapi = window.faceapi;

            onProgress('Memuat model pendeteksi wajah...');
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

            onProgress('Memuat model pengenal wajah...');
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

            onProgress('Memuat model landmark wajah...');
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

            onProgress('Memuat model ekspresi wajah (Liveness)...');
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

            // WARMUP: Memicu kompilasi WebGL/Shader agar sampel pertama tidak freeze/lama
            onProgress('Pemanasan AI (menyusun shader)...');
            try {
                const dummyCanvas = document.createElement('canvas');
                dummyCanvas.width = 224;
                dummyCanvas.height = 224;
                await faceapi.detectSingleFace(
                    dummyCanvas, 
                    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })
                ).withFaceLandmarks().withFaceExpressions().withFaceDescriptor();
            } catch (e) {
                // Abaikan jika gagal, yang penting tensor pernah dijalankan
            }

            modelsLoaded = true;
            onProgress('Model siap!');
            return faceapi;
        } catch (err) {
            loadingPromise = null;
            throw new Error('Gagal memuat model face-api: ' + err.message);
        }
    })();

    return loadingPromise;
};

/**
 * Deteksi semua wajah dalam video/image element dan ekstrak descriptor-nya.
 * @param {HTMLVideoElement|HTMLImageElement} input
 * @returns {Promise<Array<{detection, descriptor: Float32Array}>>}
 */
export const detectFaces = async (input) => {
    if (!faceapi || !modelsLoaded) throw new Error('Model belum dimuat');

    const detections = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

    return detections;
};

/**
 * Ambil descriptor wajah terbaik dari video element (1 wajah saja).
 * Digunakan saat mendaftarkan wajah baru.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<Float32Array|null>}
 */
export const captureSingleDescriptor = async (videoEl) => {
    if (!faceapi || !modelsLoaded) throw new Error('Model belum dimuat');

    const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
};

/**
 * Cocokkan descriptor dari kamera dengan daftar profil yang tersimpan.
 * @param {Float32Array} descriptor - descriptor dari kamera
 * @param {Array<{id, label, descriptors: number[][]}>} profiles - profil dari Supabase
 * @param {number} threshold - batas jarak kecocokan (default 0.5, makin kecil makin ketat)
 * @returns {{ match: object|null, distance: number }}
 */
export const matchFace = (descriptor, profiles, threshold = 0.5) => {
    if (!profiles || profiles.length === 0) return { match: null, distance: 1 };

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const profile of profiles) {
        if (!profile.descriptors || !Array.isArray(profile.descriptors)) continue;

        for (const storedDesc of profile.descriptors) {
            const storedFloat32 = new Float32Array(storedDesc);
            const distance = faceapi.euclideanDistance(descriptor, storedFloat32);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = profile;
            }
        }
    }

    if (bestDistance <= threshold) {
        return { match: bestMatch, distance: bestDistance };
    }

    return { match: null, distance: bestDistance };
};

/**
 * Konversi Float32Array descriptor menjadi array biasa untuk disimpan ke JSON/Supabase.
 * @param {Float32Array} descriptor
 * @returns {number[]}
 */
export const descriptorToArray = (descriptor) => Array.from(descriptor);

/**
 * Gambar bounding box dan label di canvas overlay.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLVideoElement} videoEl
 * @param {Array} detections - hasil detectAllFaces()
 * @param {Array} profiles - profil tersimpan untuk pencocokan label
 * @param {number} threshold
 * @param {boolean} mirror - apakah koordinat X harus di-mirror (karena video di-flip via CSS)
 */
export const drawDetections = (canvas, videoEl, detections, profiles = [], threshold = 0.5, mirror = true) => {
    const dims = faceapi.matchDimensions(canvas, videoEl, true);
    const resized = faceapi.resizeResults(detections, dims);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of resized) {
        let { x, y, width, height } = det.detection.box;

        if (mirror) {
            x = canvas.width - x - width;
        }

        // Match label
        let label = 'Tidak Dikenal';
        let confidence = null;
        if (det.descriptor && profiles.length > 0) {
            const { match, distance } = matchFace(det.descriptor, profiles, threshold);
            if (match) {
                label = match.label;
                confidence = ((1 - distance) * 100).toFixed(1);
            }
        }

        const isKnown = label !== 'Tidak Dikenal';

        // Box
        ctx.strokeStyle = isKnown ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, width, height);

        // Label background
        const text = isKnown ? `${label} (${confidence}%)` : label;
        ctx.font = 'bold 14px Inter, sans-serif';
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = isKnown ? '#22c55e' : '#ef4444';
        ctx.fillRect(x, y - 24, textWidth + 12, 24);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x + 6, y - 6);
    }
};
