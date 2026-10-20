// FILE: src/config/advisor.config.js
// Pengaturan Asisten Bisnis. Mode AI MATI secara default (asisten tetap pintar
// secara lokal, gratis, dan bekerja offline). Aktifkan hanya jika sudah
// memasang Edge Function (lihat supabase/functions/advisor-chat/index.ts).
//
// PENTING: jangan pernah menaruh API key Anthropic di sini atau di file frontend
// mana pun. Kunci hanya boleh ada di secret server (Supabase Edge Function).
export const ADVISOR_CONFIG = {
    aiEnabled: false,          // ubah ke true setelah endpoint siap
    endpoint: '',              // contoh: 'https://<project>.supabase.co/functions/v1/advisor-chat'
    anonKey: '',               // anon key Supabase (boleh publik), dikirim sebagai Authorization
    timeoutMs: 12000,          // batas tunggu satu jawaban
    minIntervalMs: 2500,       // jeda minimum antar pertanyaan ke AI
    maxPerSession: 25,         // batas pertanyaan AI per sesi (kontrol biaya)
    maxAnswerChars: 900        // potong jawaban yang terlalu panjang
};
