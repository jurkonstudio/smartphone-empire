
import { supabase } from './supabaseClient.js';

const TABLE = 'game_saves';
const SLOT = 'main';

export const SupabaseAdapter = {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    return {
      userId: data.user?.id ?? null,
      needsEmailConfirmation: !data.session
    };
  },

  async signIn(email, password) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    return { userId: data.user.id };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data, error } =
      await supabase.auth.getUser();

    if (error) throw error;

    return data.user
      ? { userId: data.user.id }
      : null;
  },

  async uploadSave(userId, payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert({
        user_id: userId,
        save_slot: SLOT,
        payload,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,save_slot'
      })
      .select('updated_at')
      .single();

    if (error) throw error;

    return { uploadedAt: data.updated_at };
  },

  async downloadSave(userId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('payload')
      .eq('user_id', userId)
      .eq('save_slot', SLOT)
      .maybeSingle();

    if (error) throw error;

    return data?.payload ?? null;
  },

  async listSaves(userId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('save_slot, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data ?? [];
  }
};
