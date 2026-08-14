<script>
	import { toast } from '$lib/stores/toast.js';
</script>

<div class="toast-container" aria-live="polite">
	{#each $toast as t (t.id)}
		<div class="toast toast-{t.type}">
			{#if t.type === 'success'}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
			{:else if t.type === 'error'}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
			{:else}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="16" x2="12" y2="12"></line>
					<line x1="12" y1="8" x2="12.01" y2="8"></line>
				</svg>
			{/if}
			
			<div style="flex: 1;">{t.message}</div>
			
			<button 
				onclick={() => toast.remove(t.id)} 
				style="background: transparent; border: none; color: inherit; cursor: pointer; padding: 0.25rem; font-size: 1.25rem; line-height: 1;"
				aria-label="Tutup"
			>
				&times;
			</button>
		</div>
	{/each}
</div>
