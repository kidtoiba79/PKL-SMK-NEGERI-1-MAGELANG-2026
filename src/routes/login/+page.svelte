<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
	import Button from '$lib/components/Button.svelte';
	import { toast } from '$lib/stores/toast.js';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	onMount(() => {
		if (!$auth.initialized) auth.initialize();
	});

	$effect(() => {
		// Jika sudah login, redirect sesuai role
		if ($auth.initialized && $auth.user && $auth.profile) {
			const role = $auth.profile.role;
			if (role === 'siswa') goto('/siswa');
			else if (role === 'dudi') goto('/pembimbing-industri');
			else if (role === 'guru') goto('/guru');
			else if (role === 'admin') goto('/admin');
			else goto('/');
		}
	});

	async function handleLogin(e) {
		e.preventDefault();
		if (!email || !password) {
			toast.error('Email dan password wajib diisi');
			return;
		}

		isLoading = true;
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		
		if (error) {
			toast.error(error.message);
			isLoading = false;
		}
		// Jika sukses, auth.onAuthStateChange di store akan trigger fetch profile dan merubah $auth state,
		// sehingga $effect di atas akan mendeteksi dan melakukan redirect.
	}
</script>

<svelte:head>
	<title>Login | SiPKL Magelang</title>
</svelte:head>

<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: var(--bg-dark); padding: var(--space-xl);">
	<div class="card" style="width: 100%; max-width: 400px; padding: var(--space-2xl); border-top: 3px solid var(--accent); background-color: var(--bg);">
		<div style="text-align: center; margin-bottom: var(--space-2xl);">
			<h1 style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem;">SiPKL</h1>
			<p class="label-overline">Sistem Informasi PKL</p>
			<p style="font-size: 0.8rem; color: var(--fg-muted); margin-top: 0.5rem;">SMK Negeri 1 Magelang</p>
		</div>

		<form onsubmit={handleLogin} class="form-group" style="gap: var(--space-lg);">
			<div class="form-group">
				<label class="form-label" for="email">Email Address</label>
				<input type="email" id="email" bind:value={email} class="input-underline" placeholder="nama@sekolah.id" disabled={isLoading} required />
			</div>

			<div class="form-group">
				<label class="form-label" for="password">Password</label>
				<input type="password" id="password" bind:value={password} class="input-underline" placeholder="••••••••" disabled={isLoading} required />
			</div>

			<div style="margin-top: var(--space-sm);">
				<Button type="submit" variant="primary" fullWidth={true} disabled={isLoading}>
					{isLoading ? 'Authenticating...' : 'Sign In'}
				</Button>
			</div>
		</form>
	</div>
</div>
