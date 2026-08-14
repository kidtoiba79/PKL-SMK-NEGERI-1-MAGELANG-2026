<script>
	/**
	 * @typedef {Object} Props
	 * @property {'hadir' | 'izin' | 'sakit' | 'alpa' | 'pending' | 'approve' | 'reject' | 'tosca'} status
	 * @property {string} [label] - Jika kosong, akan menggunakan kapitalisasi dari status
	 * @property {string} [class] - Custom classes to append
	 */

	/** @type {Props} */
	let {
		status,
		label = '',
		class: className = ''
	} = $props();

	let badgeClass = $derived(`badge badge-${status} ${className}`);
	let displayLabel = $derived(label || status);
</script>

<span class={badgeClass}>
	{displayLabel}
</span>
