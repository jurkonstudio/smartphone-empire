// FILE: src/services/AdvisorAI.js
// Jembatan opsional Asisten Bisnis -> Claude lewat endpoint SERVER (Edge Function).
// Tidak ada API key di sisi klien. Jika gagal / timeout / melebihi batas, pemanggil
// (AdvisorSystem.chat) otomatis memakai jawaban lokal AdvisorBrain.
//
// provider({ question, context, advice, history, lang }) => Promise<string>

function clip(s, n) {
    s = String(s == null ? '' : s).replace(/\s+\n/g, '\n').trim();
    return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

export function createAdvisorProvider(cfg) {
    var used = 0, lastAt = 0;
    return async function provider(payload) {
        if (!cfg || !cfg.endpoint) throw new Error('no_endpoint');
        var now = Date.now();
        if (used >= (cfg.maxPerSession || 25)) throw new Error('quota');
        if (now - lastAt < (cfg.minIntervalMs || 0)) throw new Error('too_fast');
        lastAt = now;
        used++;

        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, cfg.timeoutMs || 12000) : null;
        try {
            var headers = { 'Content-Type': 'application/json' };
            if (cfg.anonKey) { headers['Authorization'] = 'Bearer ' + cfg.anonKey; headers['apikey'] = cfg.anonKey; }
            var res = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    question: clip(payload.question, 300),
                    context: payload.context || {},
                    advice: (payload.advice || []).slice(0, 6),
                    history: (payload.history || []).slice(-6),
                    lang: payload.lang === 'en' ? 'en' : 'id'
                }),
                signal: ctrl ? ctrl.signal : undefined
            });
            if (!res.ok) throw new Error('http_' + res.status);
            var data = await res.json();
            var text = clip(data && data.text, cfg.maxAnswerChars || 900);
            if (!text) throw new Error('empty');
            return text;
        } finally {
            if (timer) clearTimeout(timer);
        }
    };
}
