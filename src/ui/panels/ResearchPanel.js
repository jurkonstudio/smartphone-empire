// FILE: src/ui/panels/ResearchPanel.js
// Tab Riset: sub-tab Teknologi | OS.
import { RESEARCH_CATEGORIES, getNodeById } from '../../data/research.data.js';
import { renderOSPanel, openOsWizardModal, openCreateOsModal, openFeatureDetailModal } from './OSPanel.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Simpan filter kategori di module-scope (bukan state game, cukup UI state).
let _filterCategory = 'all';

export function getFilterCategory() { return _filterCategory; }
export function setFilterCategory(cat) { _filterCategory = cat; }

export function renderResearchPanel({ subtab, researchSystem, osSystem }) {
    // Sub-tab bar
    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'tech' ? 'active' : ''}" data-subtab="tech">Teknologi</button>
            <button class="subtab-btn ${subtab === 'os'   ? 'active' : ''}" data-subtab="os">OS</button>
        </div>
    `;

    let body = '';
    if (subtab === 'os') {
        body = renderOSPanel({ osSystem, researchSystem });
    } else {
        body = renderTechSection({ researchSystem });
    }

    return subtabBar + body;
}

// ============================================================
// Sub-tab Teknologi
// ============================================================
function renderTechSection({ researchSystem }) {
    const data = window.__game.state.get();
    const active = data.research.active;
    const maxSlots = data.research.maxSlots;

    // Header slot
    const slotHeader = `
        <div class="card" style="padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:13px;color:var(--text-dim);">Slot Riset Aktif</div>
                <div style="font-size:16px;font-weight:700;color:var(--accent);" data-research-slots>
                    ${active.length}/${maxSlots}
                </div>
            </div>
            ${active.length === 0
                ? '<div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;">Pilih node di bawah untuk memulai riset.</div>'
                : active.map(e => `
                    <div class="active-research-row">
                        <div style="flex:1;">
                            <div style="font-size:12.5px;font-weight:600;">${escapeHtml(e.name)}</div>
                            <div style="font-size:11px;color:var(--text-dim);" data-research-eta="${e.nodeId}">
                                Menghitung...
                            </div>
                        </div>
                        <div style="font-size:12px;font-weight:600;color:var(--accent);" data-research-pct="${e.nodeId}">0%</div>
                    </div>
                    <div class="progress" style="margin-bottom:8px;height:6px;">
                        <div class="progress-bar" data-research-bar="${e.nodeId}" style="width:0%;"></div>
                    </div>
                `).join('')
            }
        </div>
    `;

    // Filter kategori
    const chipBar = `
        <div class="chip-bar">
            <button class="chip ${_filterCategory === 'all' ? 'active' : ''}" data-filter-cat="all">Semua</button>
            ${RESEARCH_CATEGORIES.map(c => `
                <button class="chip ${_filterCategory === c.id ? 'active' : ''}" data-filter-cat="${c.id}">
                    ${c.icon} ${c.name}
                </button>
            `).join('')}
        </div>
    `;

    // Daftar node
    const nodes = _filterCategory === 'all'
        ? RESEARCH_CATEGORIES.flatMap(c => researchSystem.getNodesByCategory(c.id))
        : researchSystem.getNodesByCategory(_filterCategory);

    const nodeList = nodes.map(n => renderTechNodeCard(n, researchSystem)).join('');

    return slotHeader + chipBar + `<div class="tech-node-list">${nodeList}</div>`;
}

function renderTechNodeCard(node, researchSystem) {
    const st = researchSystem.getNodeStatus(node.id);
    const cat = RESEARCH_CATEGORIES.find(c => c.id === node.category);

    return `
        <div class="tech-node tech-${st.status}" data-node-detail="${node.id}">
            <div class="tech-node-head">
                <div style="flex:1;min-width:0;">
                    <div class="tech-node-title">${escapeHtml(node.name)}</div>
                    <div class="tech-node-cat">${cat ? cat.icon + ' ' + cat.name : node.category} • Tier ${node.tier} • ${node.minYear}</div>
                </div>
                <div class="tech-status-badge badge-${st.status}">${_statusBadge(st.status)}</div>
            </div>
            <div class="tech-node-desc">${escapeHtml(node.description)}</div>
            <div class="tech-node-foot">
                <span>💰 $${node.cost.toLocaleString('en-US')}</span>
                <span>⏱ ${node.durationDays} hari</span>
                ${st.reason ? `<span class="tech-node-reason">${escapeHtml(st.reason)}</span>` : ''}
            </div>
        </div>
    `;
}

function _statusBadge(s) {
    if (s === 'done') return '✓ Selesai';
    if (s === 'running') return '⏳ Berjalan';
    if (s === 'available') return '+ Mulai';
    return '🔒 Terkunci';
}

// ============================================================
// Modal detail node riset
// ============================================================
export function openNodeDetailModal({ nodeId, researchSystem }) {
    const node = getNodeById(nodeId);
    if (!node) return;
    const st = researchSystem.getNodeStatus(nodeId);
    const cat = RESEARCH_CATEGORIES.find(c => c.id === node.category);

    // Prasyarat
    const prereqHtml = (node.prerequisites || []).length
        ? node.prerequisites.map(p => {
            const pn = getNodeById(p);
            const done = window.__game.state.get().research.completed.includes(p);
            return `<div class="sum-row"><span>${done ? '✓' : '○'} ${pn ? escapeHtml(pn.name) : p}</span><b></b></div>`;
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">Tidak ada prasyarat.</div>';

    // Efek
    const eff = node.effects || {};
    const unlockComps = (eff.unlocksComponents || []).length
        ? `<div style="font-size:12px;color:var(--text-dim);">Komponen: ${eff.unlocksComponents.join(', ')}</div>` : '';
    const unlockFeat = (eff.unlocksOsFeatures || []).length
        ? `<div style="font-size:12px;color:var(--text-dim);">Fitur OS: ${eff.unlocksOsFeatures.join(', ')}</div>` : '';

    const canStart = st.status === 'available';

    const html = `
        <div class="modal-title">${escapeHtml(node.name)}</div>
        <div class="modal-sub">${escapeHtml(node.description)}</div>
        <div class="sum-row"><span>Kategori</span><b>${cat ? cat.name : node.category}</b></div>
        <div class="sum-row"><span>Tier</span><b>${node.tier}</b></div>
        <div class="sum-row"><span>Tersedia tahun</span><b>${node.minYear}</b></div>
        <div class="sum-row"><span>Biaya</span><b>$${node.cost.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>Durasi</span><b>${node.durationDays} hari</b></div>
        <div class="card-title" style="margin-top:12px;">Prasyarat</div>
        ${prereqHtml}
        ${unlockComps || unlockFeat ? '<div class="card-title" style="margin-top:12px;">Efek</div>' + unlockComps + unlockFeat : ''}
        <div class="sum-row" style="margin-top:12px;"><span>Status</span><b>${st.reason || st.status}</b></div>
        ${canStart
            ? `<button class="btn-primary" data-research-action="start" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">Mulai Riset</button>`
            : st.status === 'running'
                ? `<button class="btn-danger" data-research-action="cancel" data-node-id="${nodeId}" style="width:100%;margin-top:12px;">Batalkan Riset</button>`
                : `<button class="btn-secondary" disabled style="width:100%;margin-top:12px;opacity:0.5;">${escapeHtml(st.reason || 'Tidak tersedia')}</button>`
        }
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">Tutup</button>
    `;
    window.__game.Modal.open('node-detail', html);
}

export { openOsWizardModal, openCreateOsModal, openFeatureDetailModal };
