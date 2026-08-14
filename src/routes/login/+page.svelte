<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { supabase } from '$lib/supabase.js';
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
	}
</script>

<svelte:head>
	<title>Login | SiPKL Magelang</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<!-- Left Form Side -->
		<div class="form-side">
			<!-- Decorative Top Left Leaf (SVG) -->
			<svg class="decor-leaf" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<path d="M0,0 Q50,0 80,40 T60,100 Q10,70 0,0" fill="url(#grad-leaf1)"/>
				<path d="M0,20 Q40,10 60,60 T30,100 Q0,80 0,20" fill="url(#grad-leaf2)"/>
				<defs>
					<linearGradient id="grad-leaf1" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#ff7b54" />
						<stop offset="100%" stop-color="#ffb26b" />
					</linearGradient>
					<linearGradient id="grad-leaf2" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#ff5200" />
						<stop offset="100%" stop-color="#ff7b54" stop-opacity="0.8"/>
					</linearGradient>
				</defs>
			</svg>

			<div class="form-content">
				<div class="brand">
					<h1>SiPKL</h1>
					<div class="brand-divider"></div>
					<div class="brand-sub">
						<span>Sistem Informasi PKL</span>
						<span>SMK N 1 Magelang</span>
					</div>
				</div>

				<form onsubmit={handleLogin} class="login-form">
					<div class="input-wrapper">
						<input 
							type="email" 
							bind:value={email} 
							placeholder="Email Address" 
							disabled={isLoading} 
							required 
						/>
					</div>

					<div class="input-wrapper">
						<input 
							type="password" 
							bind:value={password} 
							placeholder="Password" 
							disabled={isLoading} 
							required 
						/>
					</div>

					<div class="form-links">
						<a href="#">Lupa Password?</a>
						<span class="divider">|</span>
						<a href="#">Bantuan BKK</a>
					</div>

					<button type="submit" class="btn-submit" disabled={isLoading}>
						{isLoading ? 'Authenticating...' : 'Login'}
					</button>
				</form>
			</div>
		</div>

		<!-- Right Graphic Side -->
		<div class="graphic-side">
			<!-- Abstract Wavy Layers -->
			<div class="wave wave1"></div>
			<div class="wave wave2"></div>
			<div class="wave wave3"></div>

			<!-- Center Icon Illustration -->
			<div class="illustration">
				<!-- Custom Icon mimicking the medical one, but geared towards education/industry -->
				<svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
					<!-- Shield/Gear Hybrid Background -->
					<path d="M100 20 L160 40 L150 120 C140 160 100 180 100 180 C100 180 60 160 50 120 L40 40 L100 20 Z" fill="url(#grad-icon-bg)"/>
					
					<!-- Circuit/Network Nodes inside -->
					<circle cx="100" cy="100" r="40" stroke="white" stroke-width="4" stroke-dasharray="8 8"/>
					<circle cx="100" cy="100" r="20" fill="white"/>
					<circle cx="70" cy="80" r="8" fill="white"/>
					<circle cx="130" cy="120" r="8" fill="white"/>
					<circle cx="130" cy="80" r="8" fill="white"/>
					<circle cx="70" cy="120" r="8" fill="white"/>
					
					<line x1="78" y1="80" x2="122" y2="80" stroke="white" stroke-width="2"/>
					<line x1="78" y1="120" x2="122" y2="120" stroke="white" stroke-width="2"/>
					<line x1="70" y1="88" x2="70" y2="112" stroke="white" stroke-width="2"/>
					<line x1="130" y1="88" x2="130" y2="112" stroke="white" stroke-width="2"/>
					<line x1="100" y1="100" x2="130" y2="80" stroke="white" stroke-width="2"/>
					
					<defs>
						<linearGradient id="grad-icon-bg" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stop-color="#0ea5e9" />
							<stop offset="100%" stop-color="#2563eb" />
						</linearGradient>
					</defs>
				</svg>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #0b1121; /* Dark outer background */
	}

	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0b1121 100%);
	}

	.login-card {
		display: flex;
		width: 100%;
		max-width: 1100px;
		height: 650px;
		background-color: #f3f6fa;
		border-radius: 24px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		position: relative;
	}

	/* --- LEFT SIDE (FORM) --- */
	.form-side {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 3rem;
		background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
	}

	.decor-leaf {
		position: absolute;
		top: 0;
		left: 0;
		width: 150px;
		height: 150px;
		opacity: 0.9;
	}

	.form-content {
		width: 100%;
		max-width: 360px;
		z-index: 10;
	}

	.brand {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
		gap: 1rem;
	}

	.brand h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
		letter-spacing: -1px;
	}

	.brand-divider {
		width: 2px;
		height: 40px;
		background-color: #cbd5e1;
	}

	.brand-sub {
		display: flex;
		flex-direction: column;
		font-size: 0.85rem;
		color: #64748b;
		font-weight: 500;
		line-height: 1.3;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-wrapper input {
		width: 100%;
		padding: 1rem 1.5rem;
		border: 2px solid transparent;
		border-radius: 50px;
		background-color: white;
		font-size: 1rem;
		color: #334155;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
		outline: none;
	}

	.input-wrapper input:focus {
		border-color: #cbd5e1;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
		transform: translateY(-2px);
	}

	.form-links {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #3b82f6;
		margin-top: -0.25rem;
		margin-bottom: 0.5rem;
	}

	.form-links a {
		color: #3b82f6;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.form-links a:hover {
		color: #1d4ed8;
	}

	.form-links .divider {
		color: #cbd5e1;
	}

	.btn-submit {
		width: 100%;
		padding: 1rem;
		border: none;
		border-radius: 50px;
		background: #f43f5e; /* Vibrant pink/red like the reference */
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(244, 63, 94, 0.4);
		transition: all 0.3s ease;
	}

	.btn-submit:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 25px rgba(244, 63, 94, 0.5);
		background: #e11d48;
	}

	.btn-submit:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* --- RIGHT SIDE (GRAPHIC) --- */
	.graphic-side {
		flex: 1.2;
		background-color: #0f172a;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	/* Creating the abstract overlapping waves using CSS clip-path and radial gradients */
	.wave {
		position: absolute;
		top: -10%;
		bottom: -10%;
		left: -20%;
		right: 0;
		background-color: #1e293b;
		/* Simulating paper cut waves with multiple border-radius */
		border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
		box-shadow: -15px 0 35px rgba(0,0,0,0.5) inset;
		animation: floatWave 15s ease-in-out infinite alternate;
	}

	.wave1 {
		background-color: #1e293b;
		left: -10%;
		transform: scale(1.1);
		z-index: 1;
		animation-duration: 20s;
	}

	.wave2 {
		background-color: #0f172a;
		left: 10%;
		transform: scale(0.9);
		z-index: 2;
		box-shadow: -15px 0 30px rgba(0,0,0,0.6) inset;
		animation-duration: 17s;
		animation-direction: alternate-reverse;
	}

	.wave3 {
		background-color: #0c1222;
		left: 30%;
		transform: scale(0.8);
		z-index: 3;
		box-shadow: -20px 0 40px rgba(0,0,0,0.8) inset;
		background-image: radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
	}

	@keyframes floatWave {
		0% {
			border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
			transform: translateX(0) scale(1) rotate(0deg);
		}
		100% {
			border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%;
			transform: translateX(-30px) scale(1.05) rotate(5deg);
		}
	}

	.illustration {
		position: relative;
		z-index: 10;
		filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
		animation: float 6s ease-in-out infinite;
	}

	@keyframes float {
		0% { transform: translateY(0px); }
		50% { transform: translateY(-15px); }
		100% { transform: translateY(0px); }
	}

	/* RESPONSIVE */
	@media (max-width: 900px) {
		.login-page {
			padding: 1rem;
		}

		.login-card {
			flex-direction: column;
			height: auto;
			min-height: auto;
			border-radius: 16px;
		}
		
		.graphic-side {
			display: none; /* Hide complex graphic on small screens for better UX */
		}

		.form-side {
			padding: 2rem 1.5rem;
		}

		.brand h1 {
			font-size: 2rem;
		}
	}
</style>
