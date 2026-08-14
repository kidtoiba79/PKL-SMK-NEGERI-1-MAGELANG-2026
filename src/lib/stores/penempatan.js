import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';

function createPenempatanStore() {
    const { subscribe, set } = writable({
        data: null,
        loading: false
    });

    return {
        subscribe,
        /**
         * Fetch penempatan aktif siswa beserta data perusahaannya (koordinat, radius, dsb)
         */
        fetchSiswaPenempatan: async (siswa_id) => {
            set({ data: null, loading: true });
            const { data, error } = await supabase
                .from('penempatan')
                .select(`
                    id, 
                    perusahaan_id, 
                    perusahaan (nama, alamat, lat, lng, radius_meter),
                    guru_pembimbing (nama),
                    pembimbing_industri (nama)
                `)
                .eq('siswa_id', siswa_id)
                .single();
                
            if (error) {
                console.error('Error fetching penempatan:', error.message);
                set({ data: null, loading: false });
                return null;
            }
            
            set({ data, loading: false });
            return data;
        },
        clear: () => set({ data: null, loading: false })
    };
}

export const penempatan = createPenempatanStore();
