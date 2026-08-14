<script>
	/**
	 * @typedef {Object} Props
	 * @property {'text' | 'title' | 'card' | 'table' | 'circle'} [variant]
	 * @property {string} [height]
	 * @property {string} [width]
	 * @property {number} [rows]
	 * @property {string} [class]
	 */

	let {
		variant = 'text',
		height = '',
		width = '',
		rows = 3,
		class: customClass = ''
	} = $props();
</script>

{#if variant === 'table'}
	<div class="skeleton-table {customClass}">
		<div class="skeleton-shimmer skeleton-table-header"></div>
		{#each Array(rows) as _}
			<div class="skeleton-table-row">
				<div class="skeleton-shimmer skeleton-cell" style="width: 25%;"></div>
				<div class="skeleton-shimmer skeleton-cell" style="width: 40%;"></div>
				<div class="skeleton-shimmer skeleton-cell" style="width: 20%;"></div>
				<div class="skeleton-shimmer skeleton-cell" style="width: 15%;"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'card'}
	<div class="skeleton-card {customClass}">
		<div class="skeleton-shimmer skeleton-title" style="width: 50%;"></div>
		<div class="skeleton-shimmer skeleton-text" style="width: 80%;"></div>
		<div class="skeleton-shimmer skeleton-text" style="width: 60%;"></div>
	</div>
{:else if variant === 'circle'}
	<div 
		class="skeleton-shimmer skeleton-circle {customClass}" 
		style={height || width ? `width: ${width || height}; height: ${height || width};` : ''}
	></div>
{:else if variant === 'title'}
	<div 
		class="skeleton-shimmer skeleton-title {customClass}" 
		style={width ? `width: ${width};` : ''}
	></div>
{:else}
	<div class="skeleton-text-group {customClass}">
		{#each Array(rows) as _, i}
			<div 
				class="skeleton-shimmer skeleton-text" 
				style={i === rows - 1 ? 'width: 65%;' : width ? `width: ${width};` : 'width: 100%;'}
			></div>
		{/each}
	</div>
{/if}

<style>
	.skeleton-shimmer {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.04) 25%,
			rgba(255, 255, 255, 0.12) 50%,
			rgba(255, 255, 255, 0.04) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.6s infinite ease-in-out;
		border-radius: var(--radius-sm, 6px);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.skeleton-text {
		height: 14px;
		margin-bottom: 8px;
	}

	.skeleton-title {
		height: 22px;
		margin-bottom: 12px;
	}

	.skeleton-circle {
		width: 44px;
		height: 44px;
		border-radius: 50%;
	}

	.skeleton-card {
		background: var(--bg-surface, #1e293b);
		border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius, 12px);
		padding: var(--space-lg, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skeleton-table {
		width: 100%;
		border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius, 12px);
		overflow: hidden;
		background: var(--bg-surface, #1e293b);
	}

	.skeleton-table-header {
		height: 40px;
		border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
	}

	.skeleton-table-row {
		display: flex;
		gap: 1rem;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
	}

	.skeleton-cell {
		height: 16px;
	}
</style>
