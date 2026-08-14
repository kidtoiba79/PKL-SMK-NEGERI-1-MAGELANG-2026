<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';

	onMount(() => {
		if (!$auth.initialized) auth.initialize();
	});

	$effect(() => {
		if ($auth.initialized) {
			if (!$auth.user) {
				goto('/login');
			} else if ($auth.profile) {
				const role = $auth.profile.role;
				if (role === 'siswa') goto('/siswa');
				else if (role === 'dudi') goto('/pembimbing-industri');
				else if (role === 'guru') goto('/guru');
				else if (role === 'admin') goto('/admin');
			}
		}
	});
</script>

<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--bg);">
	<div class="spinner spinner-lg"></div>
</div>
