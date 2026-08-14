<script>
	import { onMount } from 'svelte';
	import Button from './Button.svelte';

	let deferredPrompt = $state(null);
	let showPrompt = $state(false);

	onMount(() => {
		// Daftarkan service worker jika belum
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch((err) => {
				console.error('Service Worker registration failed:', err);
			});
		}

		window.addEventListener('beforeinstallprompt', (e) => {
			// Cegah browser menampilkan prompt default-nya
			e.preventDefault();
			// Simpan event untuk dipakai nanti
			deferredPrompt = e;
			// Tampilkan UI custom kita
			showPrompt = true;
		});
	});

	async function installApp() {
		if (!deferredPrompt) return;
		
		// Tampilkan prompt bawaan sistem
		deferredPrompt.prompt();
		
		// Tunggu pilihan user
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			showPrompt = false;
		}
		deferredPrompt = null;
	}
</script>

{#if showPrompt}
	<div class="pwa-install-banner" style="position: fixed; bottom: 0; left: 0; right: 0; padding: var(--space-md) var(--space-lg); background: var(--bg-surface); border-top: 1px solid var(--border); box-shadow: 0 -10px 15px -3px rgba(0, 0, 0, 0.5); z-index: 9999; display: flex; justify-content: space-between; align-items: center; animation: slideUp 0.3s ease-out;">
		<div>
			<h4 style="margin: 0; color: var(--fg); font-size: 1rem;">Install SiPKL App</h4>
			<p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--fg-muted);">Tambahkan ke Layar Utama (Home Screen) agar bisa dibuka seperti aplikasi biasa.</p>
		</div>
		<div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
			<Button variant="ghost" size="sm" onclick={() => (showPrompt = false)}>Nanti</Button>
			<Button variant="primary" size="sm" onclick={installApp}>Install</Button>
		</div>
	</div>

	<style>
		@keyframes slideUp {
			from { transform: translateY(100%); }
			to { transform: translateY(0); }
		}
	</style>
{/if}
