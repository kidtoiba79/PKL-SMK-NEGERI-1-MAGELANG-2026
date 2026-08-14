<script>
	/**
	 * @typedef {Object} Props
	 * @property {'default' | 'bordered' | 'featured'} [variant='default']
	 * @property {string} [class] - Custom classes to append
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let {
		variant = 'default',
		class: className = '',
		children
	} = $props();

	let cardClass = $derived([
		variant === 'default' ? 'card' : `card-${variant}`,
		className
	].filter(Boolean).join(' '));
</script>

<div class={cardClass}>
	{@render children?.()}
</div>
