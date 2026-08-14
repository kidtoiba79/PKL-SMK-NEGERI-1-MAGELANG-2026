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
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					<button class="btn-ghost mobile-menu-btn" onclick={() => isSidebarOpen = !isSidebarOpen} aria-label="Toggle Menu" style="padding: 0.4rem; border-radius: var(--radius-sm);">
						<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>

					<div style="display: flex; align-items: center; gap: 0.5rem;">
						<img src="/logo.png" alt="Logo SMK" style="width: 26px; height: 26px; border-radius: 4px; object-fit: contain;" />
						<span style="font-weight: 700; font-size: 0.95rem; color: var(--accent);">SiPKL <span style="color: var(--fg); font-weight: 500;">SMKN 1</span></span>
					</div>
				</div>
				
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<div style="text-align: right; line-height: 1.2;">
						<div style="font-size: 0.825rem; font-weight: 600; color: var(--fg); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
							{$auth.profile?.nama || 'Pengguna'}
						</div>
						<span class="badge badge-primary" style="font-size: 0.62rem; text-transform: uppercase;">
							{$auth.profile?.role || 'Guest'}
						</span>
					</div>
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
