
import { supabase } from './supabase.config.js';

const SAVE_SLOT = 'main';

function getErrorMessage(error) {
    return error?.message || 'Terjadi kesalahan pada Supabase.';
}

export const SupabaseAdapter = {
    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password
        });

        if (error) throw new Error(getErrorMessage(error));

        return {
            userId: data.session?.user?.id || null,
            user: data.user || null,
            needsConfirmation: !data.session && !!data.user
        };
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error) throw new Error(getErrorMessage(error));

        if (!data.user) {
            throw new Error('Login berhasil diproses, tetapi akun tidak ditemukan.');
        }

        return {
            userId: data.user.id,
            user: data.user
        };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(getErrorMessage(error));
        return { ok: true };
    },

    async getCurrentUser() {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            // Sesi yang tidak tersedia bukan berarti game lokal rusak.
            return null;
        }

        return data.user
            ? { userId: data.user.id, user: data.user }
            : null;
    },

    async uploadSave(userId, payload) {
        if (!userId) throw new Error('ID akun tidak tersedia.');
        if (!payload || typeof payload !== 'object') {
            throw new Error('Data save tidak valid.');
        }

        const { error } = await supabase
            .from('game_saves')
            .upsert({
                user_id: userId,
                save_slot: SAVE_SLOT,
                payload,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,save_slot'
            });

        if (error) throw new Error(getErrorMessage(error));

        return { uploadedAt: new Date().toISOString() };
    },

    async downloadSave(userId) {
        if (!userId) throw new Error('ID akun tidak tersedia.');

        const { data, error } = await supabase
            .from('game_saves')
            .select('payload, updated_at')
            .eq('user_id', userId)
            .eq('save_slot', SAVE_SLOT)
            .maybeSingle();

        if (error) throw new Error(getErrorMessage(error));

        if (!data) return null;

        return {
            payload: data.payload,
            updatedAt: data.updated_at
        };
    },

    async listSaves(userId) {
        if (!userId) return [];

        const { data, error } = await supabase
            .from('game_saves')
            .select('save_slot, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw new Error(getErrorMessage(error));

        return data || [];
    }
};

