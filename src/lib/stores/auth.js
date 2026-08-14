import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

function createAuthStore() {
    const { subscribe, set, update } = writable({
        user: null,
        profile: null,
        loading: true,
        initialized: false
    });

    async function fetchProfile(user) {
        if (!user) return;
        
        try {
            // Ambil profile dasar
            const { data: profile, error } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (error) throw error;
            
            // Ambil data spesifik berdasarkan role (siswa_id, dll) agar mudah diakses
            let specificData = null;
            if (profile.role === 'siswa') {
                const { data } = await supabase.from('siswa').select('id, nis, kelas, jurusan').eq('user_id', user.id).single();
                if (data) specificData = { siswa_id: data.id, ...data };
            } else if (profile.role === 'guru') {
                const { data } = await supabase.from('guru_pembimbing').select('id, nip').eq('user_id', user.id).single();
                if (data) specificData = { guru_id: data.id, ...data };
            } else if (profile.role === 'dudi') {
                const { data } = await supabase.from('pembimbing_industri').select('id, perusahaan_id, jabatan').eq('user_id', user.id).single();
                if (data) specificData = { dudi_id: data.id, ...data };
            }

            set({ user, profile: { ...profile, ...specificData }, loading: false, initialized: true });
        } catch (error) {
            console.error('Error fetching profile:', error.message);
            set({ user, profile: null, loading: false, initialized: true });
        }
    }

    return {
        subscribe,
        initialize: async () => {
            update(s => ({ ...s, loading: true }));
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                await fetchProfile(session.user);
            } else {
                set({ user: null, profile: null, loading: false, initialized: true });
            }

            // Dengarkan perubahan status login
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    await fetchProfile(session?.user);
                } else if (event === 'SIGNED_OUT') {
                    set({ user: null, profile: null, loading: false, initialized: true });
                }
            });
        },
        signOut: async () => {
            await supabase.auth.signOut();
        }
    };
}

export const auth = createAuthStore();
