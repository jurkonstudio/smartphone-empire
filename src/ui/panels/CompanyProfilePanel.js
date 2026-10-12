// FILE: src/ui/panels/CompanyProfilePanel.js
// Halaman Profil Perusahaan.
import { CloudService } from '../../services/CloudService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const DIFF_LABEL = {
    santai: { label: 'Santai', color: 'var(--success)' },
    normal: { label: 'Normal', color: 'var(--info)' },
    sulit:  { label: 'Sulit',  color: 'var(--danger)' }
};

const ERA_LABEL = {
    feature_phone:     'Feature Phone',
    touch_revolution:  'Touch Revolution',
    modern_smartphone: 'Smartphone Modern',
    ai_ecosystem:      'AI & Ecosystem'
};

export function renderCompanyProfilePanel({ teamSystem, marketSystem, competitors, opinionSystem }) {
    const data = window.__game.state.get();
    const t = data.time;

    const totalRevenue = (data.products.catalog || []).reduce((s, p) => s + (p.totalRevenue || 0), 0);
    const totalSold    = (data.products.catalog || []).reduce((s, p) => s + (p.totalSold || 0), 0);
    const activeProducts = (data.products.catalog || []).filter(p => p.status === 'selling').length;
    const totalProducts  = (data.products.catalog || []).length;

    const staffCount = (data.staff || []).length;
    const monthlySalary = teamSystem ? teamSystem.getTotalSalary() : 0;
    const avgMorale = teamSystem ? teamSystem.getAverageMorale() : 0;

    const reputation = Math.round(data.market.reputation || 0);
    const sentiment = opinionSystem ? opinionSystem.getSentiment() : 50;
    const marketShare = data.market.share || 0;

    const milestones = (data.milestones || []).slice().reverse();
    const diffInfo = DIFF_LABEL[data.difficulty] || DIFF_LABEL.normal;

    const competitorsList = (data.market.competitors || []).slice().sort((a, b) => b.share - a.share);
    const playerRank = 1 + competitorsList.filter(c => c.share > marketShare).length;
    const totalCompanies = 1 + competitorsList.length;

    const headerCard = `
        <div class="profile-hero">
            <div class="profile-logo">${escapeHtml(data.companyName.charAt(0).toUpperCase())}</div>
            <div class="profile-name">${escapeHtml(data.companyName)}</div>
            <div class="profile-meta">
                <span class="profile-difficulty" style="color:${diffInfo.color};">● ${diffInfo.label}</span>
                <span>•</span>
                <span>Berdiri 2000</span>
            </div>
            <div class="profile-era">
                ${ERA_LABEL[data.era] || data.era} • Tahun ${t.currentYear}
            </div>
        </div>
    `;

    const kpis = `
        <div class="kpi-grid">
            <div class="kpi green">
                <div class="kpi-label">Pendapatan Total</div>
                <div class="kpi-value" style="font-size:15px;">$${totalRevenue.toLocaleString('en-US')}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">Unit Terjual</div>
                <div class="kpi-value" style="font-size:15px;">${totalSold.toLocaleString('en-US')}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">Peringkat Pasar</div>
                <div class="kpi-value">#${playerRank}<span style="font-size:12px;color:var(--text-dim);">/${totalCompanies}</span></div>
            </div>
            <div class="kpi">
                <div class="kpi-label">Pangsa Pasar</div>
                <div class="kpi-value" style="font-size:15px;">${(marketShare * 100).toFixed(1)}%</div>
            </div>
        </div>
    `;

    const opsCard = `
        <div class="card">
            <div class="card-title">Ringkasan Operasional</div>
            <div class="sum-row"><span>Uang tunai</span><b>$${data.cash.toLocaleString('en-US')}</b></div>
            <div class="sum-row"><span>Produk aktif</span><b>${activeProducts} / ${totalProducts}</b></div>
            <div class="sum-row"><span>Total staff</span><b>${staffCount} orang</b></div>
            <div class="sum-row"><span>Gaji bulanan</span><b>$${monthlySalary.toLocaleString('en-US')}</b></div>
            <div class="sum-row"><span>Moral rata-rata</span><b style="color:${avgMorale >= 70 ? 'var(--success)' : avgMorale >= 40 ? 'var(--warn)' : 'var(--danger)'};">${avgMorale}/100</b></div>
            <div class="sum-row"><span>Reputasi</span><b>${reputation}/100</b></div>
            <div class="sum-row"><span>Sentimen publik</span><b>${sentiment}/100</b></div>
        </div>
    `;

    const milestonesHtml = milestones.length
        ? milestones.map(m => `
            <div class="ms-row">
                <span class="ms-year">${m.year}</span>
                <span class="ms-text">${escapeHtml(m.text)}</span>
            </div>
        `).join('')
        : '<div class="log-empty">Belum ada pencapaian. Terus kembangkan perusahaan!</div>';

    const milestonesCard = `
        <div class="card">
            <div class="card-title">Pencapaian (${milestones.length})</div>
            ${milestonesHtml}
        </div>
    `;

    const cloudStatus = CloudService.getStatus();
    const cloudLabel = {
        disconnected: 'Belum terhubung',
        connecting:   'Menghubungkan...',
        connected:    'Tersinkron',
        error:        'Gagal terhubung'
    }[cloudStatus] || cloudStatus;
    const cloudColor = cloudStatus === 'connected' ? 'var(--success)' :
                       cloudStatus === 'connecting' ? 'var(--warn)' :
                       cloudStatus === 'error' ? 'var(--danger)' : 'var(--text-mute)';

    const cloudCard = `
        <div class="card">
            <div class="card-title">☁️ Cloud Sync</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:13px;color:var(--text-dim);">Status</div>
                <div style="font-size:13px;font-weight:700;color:${cloudColor};">${cloudLabel}</div>
            </div>
            <div style="font-size:11.5px;color:var(--text-mute);line-height:1.5;margin-bottom:10px;">
                Sinkronisasi cloud akan hadir di update berikutnya. Save Anda saat ini tersimpan lokal di perangkat.
            </div>
            <button class="btn-secondary" disabled style="width:100%;font-size:12px;padding:8px;opacity:0.55;cursor:not-allowed;">
                Atur Cloud (Coming Soon)
            </button>
        </div>
    `;

    return headerCard + kpis + opsCard + milestonesCard + cloudCard;
}

export function bindCompanyProfileActions(root) {
    // Placeholder untuk future
                  }
