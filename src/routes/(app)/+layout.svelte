<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';

	let { children } = $props();

	onMount(() => {
		if (!$auth.initialized) {
			auth.initialize();
		}
	});

	$effect(() => {
		if ($auth.initialized && !$auth.loading && !$auth.user) {
			goto('/login');
		}
	});
</script>

{#if !$auth.initialized || $auth.loading}
	<div class="app-shell" style="align-items: center; justify-content: center; background: var(--bg);">
		<div class="spinner spinner-lg"></div>
	</div>
{:else if $auth.user}
	<div class="app-shell">
		<Sidebar />
		<main class="main-content">
			<div class="page-content">
				{@render children()}
			</div>
		</main>
		<InstallPrompt />
	</div>
{/if}
