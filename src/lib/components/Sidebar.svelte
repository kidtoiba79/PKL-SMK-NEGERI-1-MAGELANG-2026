<script>
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.js';
	
	let isOpen = $state(false);

	// Menu list berdasarkan role
	let menus = $derived.by(() => {
		const role = $auth.profile?.role;
		
		const base = [{ path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }];

		if (role === 'siswa') {
			base.push({ path: '/siswa/absensi', label: 'Absensi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' });
			base.push({ path: '/siswa/jurnal', label: 'Jurnal Harian', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
			base.push({ path: '/siswa/laporan', label: 'Laporan Akhir', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
		} else if (role === 'dudi') {
			base.push({ path: '/pembimbing-industri/jurnal', label: 'Validasi Jurnal', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' });
			base.push({ path: '/pembimbing-industri/absensi', label: 'Kehadiran Siswa', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
		} else if (role === 'guru') {
			base.push({ path: '/guru/monitoring', label: 'Monitoring Siswa', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' });
			base.push({ path: '/guru/laporan', label: 'Nilai Laporan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
		} else if (role === 'admin') {
			base.push({ path: '/admin/siswa', label: 'Data Siswa', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
			base.push({ path: '/admin/perusahaan', label: 'Data Perusahaan', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' });
			base.push({ path: '/admin/penempatan', label: 'Penempatan PKL', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' });
			base.push({ path: '/admin/absensi-wajah', label: 'Face Registration', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' });
			base.push({ path: '/admin/monitor-tv', label: 'Monitor TV', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' });
		}

		return base;
	});

	function toggleSidebar() {
		isOpen = !isOpen;
	}

	function handleSignOut() {
		auth.signOut();
	}
</script>

<aside class="sidebar {isOpen ? 'open' : 'sidebar-hidden'}">
	<!-- Logo Area -->
	<div style="height: var(--navbar-height); padding: 0 var(--space-xl); display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
		<span style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--accent);">SiPKL <span style="color: var(--fg-inverted); font-weight: 400;">Magelang</span></span>
	</div>

	<!-- Navigation -->
	<nav style="flex: 1; padding: var(--space-xl) 0; display: flex; flex-direction: column; gap: 0.25rem;">
		<span class="label-overline" style="padding: 0 var(--space-xl); margin-bottom: 0.5rem; color: rgba(255,255,255,0.4);">Menu Utama</span>
		
		{#each menus as menu}
			<a href={menu.path} class="nav-item {$page.url.pathname === menu.path ? 'active' : ''}" onclick={() => isOpen = false}>
				<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d={menu.icon}></path></svg>
				{menu.label}
			</a>
		{/each}
	</nav>

	<!-- User Profile Area -->
	<div style="padding: var(--space-lg) var(--space-xl); border-top: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2);">
		<div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem;">{$auth.profile?.nama || 'User'}</div>
		<div style="font-size: 0.7rem; color: var(--accent); margin-bottom: 1rem; text-transform: capitalize;">Role: {$auth.profile?.role || 'Guest'}</div>
		<button class="btn btn-sm btn-ghost btn-full" style="color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2);" onclick={handleSignOut}>
			Keluar
		</button>
	</div>
</aside>

<!-- Mobile Overlay -->
{#if isOpen}
	<div class="modal-overlay" style="z-index: 45;" onclick={toggleSidebar} role="presentation"></div>
{/if}

<!-- Navbar Header (Mobile Toggle) -->
<header class="navbar" style="justify-content: space-between;">
	<button class="btn-ghost" style="border: none; padding: 0.5rem; display: flex;" onclick={toggleSidebar} aria-label="Toggle Menu">
		<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
	</button>
	
	<div style="font-size: 0.8rem; font-weight: 500;">
		{$auth.profile?.nama || ''} 
	</div>
</header>
