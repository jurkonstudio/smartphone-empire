// FILE: src/ui/panels/PublicOpinionPanel.js
// Sub-tab Publik dalam tab Pasar. Menampilkan sentimen, feed, saran, viral.

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const ASPECT_LABELS = {
    design:      { name: 'Desain',       icon: '🎨' },
    camera:      { name: 'Kamera',       icon: '📷' },
    battery:     { name: 'Baterai',      icon: '🔋' },
    performance: { name: 'Performa',     icon: '⚡' },
    price:       { name: 'Harga/Nilai',  icon: '💰' },
    reliability: { name: 'Keandalan',    icon: '🛡️' },
    os:          { name: 'OS/Software',  icon: '💿' },
    support:     { name: 'Purna Jual',   icon: '🎧' }
};

export function renderPublicOpinionPanel({ opinionSystem }) {
    const sentiment = opinionSystem.getSentiment();
    const aspects = opinionSystem.getAspectSentiment();
    const feed = opinionSystem.getFeed(20);
    const viral = opinionSystem.getActiveViral();
    const suggestions = opinionSystem.getSuggestions();
    const perProduct = opinionSystem.getPerProductSatisfaction();
    const competitorSent = opinionSystem.getCompetitorSentiment();
    const data = window.__game.state.get();

    // Sentimen label
    const sentLabel = sentiment >= 70 ? 'Sangat Baik' : sentiment >= 55 ? 'Baik' : sentiment >= 45 ? 'Netral' : sentiment >= 30 ? 'Buruk' : 'Sangat Buruk';
    const sentColor = sentiment >= 70 ? 'var(--accent)' : sentiment >= 55 ? 'var(--info)' : sentiment >= 45 ? 'var(--text)' : sentiment >= 30 ? 'var(--warn)' : 'var(--danger)';

    // ---- Kartu sentimen ----
    const sentimentHtml = `
        <div class="card">
            <div class="card-title">Sentimen Publik</div>
            <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;">
                <div style="font-size:28px;font-weight:800;color:${sentColor};">${sentiment}</div>
                <div style="font-size:13px;color:${sentColor};">${sentLabel}</div>
            </div>
            <div class="progress" style="height:6px;">
                <div class="progress-bar" style="width:${sentiment}%;background:${sentColor};"></div>
            </div>
        </div>
    `;

    // ---- Kartu per aspek ----
    const aspectRows = Object.keys(ASPECT_LABELS).map(k => {
        const v = Math.round(aspects[k] || 0);
        const label = ASPECT_LABELS[k];
        const col = v >= 70 ? 'var(--accent)' : v >= 45 ? 'var(--info)' : v >= 30 ? 'var(--warn)' : 'var(--danger)';
        return `
            <div style="margin-bottom:8px;">
                <div class="progress-label">
                    <span>${label.icon} ${label.name}</span>
                    <span>${v}</span>
                </div>
                <div class="progress" style="height:5px;">
                    <div class="progress-bar" style="width:${v}%;background:${col};"></div>
                </div>
            </div>
        `;
    }).join('');
    const aspectHtml = `
        <div class="card">
            <div class="card-title">Per Aspek</div>
            ${aspectRows}
        </div>
    `;

    // ---- Perbandingan dengan kompetitor ----
    const comparisonRows = [];
    comparisonRows.push(`
        <div class="sum-row"><span><b style="color:var(--accent);">Anda</b></span><b>${sentiment}</b></div>
    `);
    Object.keys(competitorSent).slice(0, 5).forEach(id => {
        const val = Math.round(competitorSent[id]);
        const comp = data.market.competitors.find(c => c.id === id);
        if (!comp) return;
        comparisonRows.push(`
            <div class="sum-row"><span>${escapeHtml(comp.name)}</span><b>${val}</b></div>
        `);
    });
    const comparisonHtml = `
        <div class="card">
            <div class="card-title">Perbandingan Kepuasan</div>
            ${comparisonRows.join('')}
        </div>
    `;

    // ---- Viral aktif ----
    const viralHtml = viral.length ? `
        <div class="card" style="border-left:3px solid ${viral[0].type === 'positive' ? 'var(--accent)' : 'var(--danger)'};">
            <div class="card-title">${viral[0].type === 'positive' ? '✨ Viral Positif' : '⚠ Viral Negatif'}</div>
            ${viral.map(v => {
                const remaining = Math.ceil((v.endsAtMinute - data.time.elapsedGameMinutes) / (24 * 60));
                return `
                    <div style="margin-bottom:10px;">
                        <div style="font-size:13px;font-weight:600;color:${v.type === 'positive' ? 'var(--accent)' : 'var(--danger)'};">${escapeHtml(v.title)}</div>
                        <div style="font-size:11.5px;color:var(--text-dim);margin-top:2px;">${escapeHtml(v.text)}</div>
                        <div style="font-size:10.5px;color:var(--text-mute);margin-top:4px;">Berakhir dalam ~${remaining} hari</div>
                        ${v.type === 'negative' ? `
                            <button class="btn-secondary" data-viral-respond data-viral-id="${v.id}" style="margin-top:8px;width:100%;font-size:12px;padding:8px;">
                                Pilih Respons
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // ---- Saran pelanggan ----
    const suggestionsHtml = suggestions.length ? `
        <div class="card">
            <div class="card-title">Saran dari Pelanggan</div>
            ${suggestions.map(s => `
                <div style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:12.5px;">
                    <div style="color:var(--text);">💡 ${escapeHtml(s.text)}</div>
                    <div style="font-size:10.5px;color:var(--text-mute);margin-top:2px;">Skor aspek: ${s.score}/100</div>
                </div>
            `).join('')}
        </div>
    ` : '';

    // ---- Kepuasan per produk ----
    const productRows = Object.keys(perProduct).slice(0, 5).map(pid => {
        const p = data.products.catalog.find(x => x.id === pid);
        if (!p) return '';
        const score = perProduct[pid];
        const col = score >= 70 ? 'var(--accent)' : score >= 45 ? 'var(--info)' : 'var(--warn)';
        return `
            <div class="sum-row">
                <span>${escapeHtml(p.name)}</span>
                <b style="color:${col};">${score}/100</b>
            </div>
        `;
    }).filter(Boolean).join('');
    const productHtml = productRows ? `
        <div class="card">
            <div class="card-title">Kepuasan per Produk</div>
            ${productRows}
        </div>
    ` : '';

    // ---- Feed ulasan ----
    const feedHtml = feed.length ? `
        <div class="card">
            <div class="card-title">Feed Ulasan (${feed.length})</div>
            ${feed.slice(0, 15).map(r => {
                const col = r.score >= 7 ? 'var(--accent)' : r.score >= 5 ? 'var(--info)' : r.score >= 3 ? 'var(--warn)' : 'var(--danger)';
                return `
                    <div style="padding:10px 0;border-bottom:1px dashed var(--border);">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                            <div style="font-size:11.5px;color:var(--text-mute);">${escapeHtml(r.source)} • ${r.day}/${r.month}/${r.year}</div>
                            <div style="font-size:13px;font-weight:700;color:${col};">${r.score}/10</div>
                        </div>
                        <div style="font-size:12.5px;color:var(--text);margin-top:4px;line-height:1.5;">${escapeHtml(r.text)}</div>
                        ${r.productName ? `<div style="font-size:10.5px;color:var(--text-mute);margin-top:3px;">→ ${escapeHtml(r.productName)}</div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    ` : `
        <div class="empty">
            <div class="empty-ico">💬</div>
            <div class="empty-title">Belum ada ulasan</div>
            <div class="empty-desc">Rilis ponsel dulu agar publik mulai berkomentar.</div>
        </div>
    `;

    return sentimentHtml + viralHtml + aspectHtml + comparisonHtml + suggestionsHtml + productHtml + feedHtml;
}

// ============================================================
// Modal pilih respons viral
// ============================================================
export function openViralResponseModal({ viralId }) {
    const { VIRAL_RESPONSES } = window.__game.modules.feedbackData;
    const html = `
        <div class="modal-title">Respons Viral Negatif</div>
        <div class="modal-sub">Pilih cara menanggapi. Respons kuat butuh biaya.</div>
        ${VIRAL_RESPONSES.map(r => `
            <button class="wiz-option" data-viral-response-pick="${r.id}" data-viral-id="${viralId}" style="width:100%;margin-bottom:6px;text-align:left;">
                <div class="wiz-opt-name">${escapeHtml(r.label)}</div>
                <div class="wiz-opt-meta">${r.cost > 0 ? '$' + r.cost.toLocaleString('en-US') : 'Gratis'} • ${escapeHtml(r.description)}</div>
            </button>
        `).join('')}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">Batal</button>
    `;
    window.__game.Modal.open('viral-response', html);
  }
