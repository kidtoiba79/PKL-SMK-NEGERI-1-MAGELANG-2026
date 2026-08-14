<script>
	/**
	 * @typedef {Object} Props
	 * @property {'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'} [variant='primary']
	 * @property {'sm' | 'md' | 'lg'} [size='md']
	 * @property {boolean} [fullWidth=false]
	 * @property {string} [type='button']
	 * @property {boolean} [disabled=false]
	 * @property {string} [class] - Custom classes to append
	 * @property {import('svelte').Snippet} [children]
	 * @property {Function} [onclick]
	 */

	/** @type {Props} */
	let {
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		onclick
	} = $props();

	let btnClass = $derived([
		'btn',
		`btn-${variant}`,
		size !== 'md' ? `btn-${size}` : '',
		fullWidth ? 'btn-full' : '',
		className
	].filter(Boolean).join(' '));
</script>

<button
	{type}
	class={btnClass}
	{disabled}
	{onclick}
>
	<span>
		{@render children?.()}
	</span>
</button>
