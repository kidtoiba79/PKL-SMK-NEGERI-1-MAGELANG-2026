<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';

	let { children } = $props();
	let isSidebarOpen = $state(false);

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
		<Sidebar isOpen={isSidebarOpen} onClose={() => isSidebarOpen = false} />
		
		<div class="main-wrapper">
			<!-- Navbar Header (Desktop & Mobile) -->
			<header class="navbar">
				<button class="btn-ghost mobile-menu-btn" onclick={() => isSidebarOpen = !isSidebarOpen} aria-label="Toggle Menu">
					<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
				</button>
				
				<div class="navbar-title">
					{$auth.profile?.nama || ''} 
				</div>
			</header>

			<main class="main-content">
				<div class="page-content">
					{@render children()}
				</div>
			</main>
		</div>
		<InstallPrompt />
	</div>
{/if}
