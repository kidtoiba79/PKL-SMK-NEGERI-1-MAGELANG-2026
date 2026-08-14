<script>
	/**
	 * @typedef {Object} Props
	 * @property {'checking' | 'inside' | 'outside' | 'error'} [status='checking']
	 * @property {number} [distance=0]
	 * @property {number} [maxRadius=500]
	 */

	/** @type {Props} */
	let { 
		status = 'checking',
		distance = 0,
		maxRadius = 500
	} = $props();

	let config = $derived.by(() => {
		if (status === 'checking') return { color: 'var(--color-pending)', text: 'Mengecek Lokasi GPS...', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' };
		if (status === 'inside') return { color: 'var(--color-hadir)', text: `Dalam Radius (${distance}m / ${maxRadius}m)`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
		if (status === 'outside') return { color: 'var(--color-reject)', text: `Di Luar Radius (${distance}m / ${maxRadius}m)`, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' };
		return { color: 'var(--color-izin)', text: 'Gagal mendapatkan lokasi', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
	});
</script>

<div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid {config.color}; background: {config.color}15; max-width: fit-content;">
	<svg width="18" height="18" fill="none" stroke={config.color} stroke-width="2" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" d={config.icon}></path>
	</svg>
	<span style="font-size: 0.75rem; font-weight: 600; color: {config.color};">{config.text}</span>
</div>
