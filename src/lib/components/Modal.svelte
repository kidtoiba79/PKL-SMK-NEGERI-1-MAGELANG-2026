<script>
	/**
	 * @typedef {Object} Props
	 * @property {boolean} show
	 * @property {string} title
	 * @property {Function} [onclose]
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('svelte').Snippet} [footer]
	 */

	/** @type {Props} */
	let {
		show,
		title,
		onclose,
		children,
		footer
	} = $props();

	// Close on Escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && show && onclose) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget && onclose) onclose(); }}>
		<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<div class="modal-header">
				<h2 id="modal-title" style="font-size: 1.25rem; font-weight: 700; margin: 0;">{title}</h2>
				{#if onclose}
					<button 
						onclick={onclose} 
						class="btn-ghost" 
						style="padding: 0.25rem 0.5rem; border: none; font-size: 1.2rem; line-height: 1;"
						aria-label="Tutup"
					>
						&times;
					</button>
				{/if}
			</div>
			
			<div class="modal-body">
				{@render children?.()}
			</div>
			
			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
