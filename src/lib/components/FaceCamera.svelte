<script>
	import { onMount, onDestroy } from 'svelte';
	import { toast } from '$lib/stores/toast.js';

	/**
	 * @typedef {Object} Props
	 * @property {Function} onCapture - Callback menerima elemen canvas
	 * @property {boolean} isProcessing - State saat wajah sedang diverifikasi
	 */

	/** @type {Props} */
	let { 
		onCapture = () => {},
		isProcessing = false 
	} = $props();

	let videoElement;
	let canvasElement;
	let stream;
	let isCameraReady = $state(false);
	let autoCaptureInterval;

	onMount(async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
			});
			if (videoElement) {
				videoElement.srcObject = stream;
				videoElement.onloadedmetadata = () => {
					videoElement.play();
					isCameraReady = true;
					// Mulai auto capture
					autoCaptureInterval = setInterval(capture, 1500);
				};
			}
		} catch (error) {
			toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
		}
	});

	onDestroy(() => {
		if (autoCaptureInterval) clearInterval(autoCaptureInterval);
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
		}
	});

	function capture() {
		if (!isCameraReady || isProcessing) return;
		
		const context = canvasElement.getContext('2d');
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
		
		onCapture(canvasElement);
	}
</script>

<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; border: 1px solid var(--border-strong); background: var(--bg-dark);">
	<!-- svelte-ignore a11y_media_has_caption -->
	<video bind:this={videoElement} style="width: 100%; display: block;" playsinline></video>
	<canvas bind:this={canvasElement} style="display: none;"></canvas>

	{#if !isCameraReady}
		<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
			<div class="spinner spinner-lg"></div>
		</div>
	{/if}

	{#if isCameraReady && !isProcessing}
		<div style="position: absolute; bottom: 1.5rem; left: 0; right: 0; text-align: center; pointer-events: none;">
			<span class="badge badge-success" style="font-size: 0.8rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
				🤖 Pemindaian Wajah Otomatis Aktif
			</span>
		</div>
	{/if}

	{#if isProcessing}
		<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(11, 43, 43, 0.85); backdrop-filter: blur(4px);">
			<div style="text-align: center; color: var(--fg-inverted);">
				<div class="spinner spinner-lg" style="margin: 0 auto 1rem;"></div>
				<div class="label-overline" style="color: var(--fg-inverted);">Memverifikasi Wajah...</div>
			</div>
		</div>
	{/if}
</div>
