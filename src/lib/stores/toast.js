import { writable } from 'svelte/store';

function createToastStore() {
    const { subscribe, update } = writable([]);

    return {
        subscribe,
        /**
         * Menambahkan toast baru
         * @param {string} message 
         * @param {'success' | 'error' | 'info'} type 
         * @param {number} timeout Waktu tampil dalam ms (default 3000)
         */
        add: (message, type = 'info', timeout = 3000) => {
            const id = Math.random().toString(36).substring(2, 9);
            update(toasts => [...toasts, { id, message, type }]);

            if (timeout > 0) {
                setTimeout(() => {
                    update(toasts => toasts.filter(t => t.id !== id));
                }, timeout);
            }
        },
        /**
         * Menghapus toast berdasarkan ID
         */
        remove: (id) => update(toasts => toasts.filter(t => t.id !== id)),
        
        // Helper methods
        success: (msg, timeout) => toast.add(msg, 'success', timeout),
        error: (msg, timeout) => toast.add(msg, 'error', timeout),
        info: (msg, timeout) => toast.add(msg, 'info', timeout),
    };
}

export const toast = createToastStore();
