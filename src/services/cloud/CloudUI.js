
import { CloudService } from '../services/CloudService.js';
import { SupabaseAdapter } from './SupabaseAdapter.js';
import { state } from '../core/GameState.js';
import { SaveService } from '../core/SaveService.js';

let adapterRegistered = false;
let initializationPromise = null;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function ensureCloudInitialized() {
    if (!adapterRegistered) {
        const result = CloudService.registerAdapter(SupabaseAdapter);
        adapterRegistered = !!result.ok;
    }

    if (!initializationPromise) {
        initializationPromise = CloudService.initialize()
            .finally(() => {
                initializationPromise = null;
            });
    }

    return initializationPromise;
}

function statusLabel() {
    const status = CloudService.getStatus();

    const labels = {
        connected: 'Terhubung',
        connecting: 'Menghubungkan...',
        disconnected: 'Belum login',
        error: 'Terjadi kesalahan'
    };

    return labels[status] || 'Status tidak diketahui';
}

function renderAccountContent() {
    const userId = CloudService.getUserId();
    const status = CloudService.getStatus();

    if (userId) {
        return `
            <div class="cloud-account-info">
                <div class="cloud-status-row">
                    <span>Status akun</span>
                    <strong class="cloud-status cloud-status-connected">
                        ${escapeHTML(statusLabel())}
                    </strong>
                </div>

                <p class="cloud-muted">
                    Akun sudah terhubung. Kamu dapat menyimpan progres
                    atau memeriksa save cloud secara manual.
                </p>

                <div class="cloud-actions">
                    <button type="button" class="cloud-button cloud-button-primary"
                        data-cloud-action="upload">
                        Simpan ke Cloud
                    </button>

                    <button type="button" class="cloud-button"
                        data-cloud-action="download">
                        Muat dari Cloud
                    </button>
                </div>

                <button type="button" class="cloud-button cloud-button-danger"
                    data-cloud-action="logout">
                    Keluar dari akun
                </button>
            </div>
        `;
    }

    return `
        <div class="cloud-auth-tabs">
            <button type="button" class="cloud-auth-tab is-active"
                data-cloud-mode="login">Login</button>
            <button type="button" class="cloud-auth-tab"
                data-cloud-mode="signup">Buat akun</button>
        </div>

        <form class="cloud-auth-form" data-cloud-form="auth">
            <label class="cloud-field">
                <span>Email</span>
                <input type="email" name="email" autocomplete="email"
                    placeholder="nama@email.com" required maxlength="254">
            </label>

            <label class="cloud-field">
                <span>Password</span>
                <input type="password" name="password"
                    autocomplete="current-password"
                    placeholder="Masukkan password" required minlength="6"
                    maxlength="128">
            </label>

            <button type="submit" class="cloud-button cloud-button-primary"
                data-cloud-submit>
                Login
            </button>

            <p class="cloud-muted">
                Gunakan akun milikmu sendiri. Jangan bagikan password
                kepada siapa pun.
            </p>
        </form>
    `;
}

export function renderCloudPanel() {
    return `
        <section class="cloud-panel" data-cloud-panel>
            <div class="cloud-panel-heading">
                <div>
                    <p class="cloud-eyebrow">AKUN & PENYIMPANAN</p>
                    <h3>Akun dan Cloud Save</h3>
                    <p class="cloud-muted">
                        Simpan progres game agar dapat diakses kembali
                        setelah login pada perangkat lain.
                    </p>
                </div>
                <span class="cloud-icon" aria-hidden="true">☁</span>
            </div>

            <div class="cloud-status-row">
                <span>Koneksi</span>
                <strong data-cloud-status>${escapeHTML(statusLabel())}</strong>
            </div>

            <div class="cloud-notice" data-cloud-message role="status"
                aria-live="polite">
                Save lokal tetap tersedia saat cloud tidak digunakan.
            </div>

            <div data-cloud-content>
                ${renderAccountContent()}
            </div>

            <p class="cloud-footnote">
                Catatan: memuat save cloud dapat mengganti progres lokal.
                Game akan meminta konfirmasi sebelum melakukannya.
            </p>
        </section>
    `;
}

function showMessage(root, message, type = 'info') {
    const target = root.querySelector('[data-cloud-message]');
    if (!target) return;

    target.textContent = message;
    target.dataset.type = type;
}

function refreshPanel(root) {
    const panel = root.querySelector('[data-cloud-panel]');
    if (!panel) return;

    const status = panel.querySelector('[data-cloud-status]');
    const content = panel.querySelector('[data-cloud-content]');

    if (status) status.textContent = statusLabel();
    if (content) content.innerHTML = renderAccountContent();
}

function setBusy(root, busy) {
    root.querySelectorAll('[data-cloud-action], [data-cloud-submit]')
        .forEach((button) => {
            button.disabled = busy;
        });

    const status = root.querySelector('[data-cloud-status]');
    if (status && busy) status.textContent = 'Memproses...';
}

function getSavePayload() {
    return {
        version: 4,
        savedAt: Date.now(),
        data: state.serialize()
    };
}

export function bindCloudUI(root) {
    if (!root || root.dataset.cloudUiBound === 'true') return;
    root.dataset.cloudUiBound = 'true';

    let authMode = 'login';
    let busy = false;

    // Pulihkan sesi jika sebelumnya pemain pernah login.
    ensureCloudInitialized().then((result) => {
        refreshPanel(root);

        if (!result.ok && result.reason) {
            showMessage(root, result.reason, 'error');
        }
    });

    root.addEventListener('click', async (event) => {
        const modeButton = event.target.closest('[data-cloud-mode]');
        if (modeButton && root.contains(modeButton)) {
            authMode = modeButton.dataset.cloudMode === 'signup'
                ? 'signup'
                : 'login';

            root.querySelectorAll('[data-cloud-mode]').forEach((button) => {
                const active = button.dataset.cloudMode === authMode;
                button.classList.toggle('is-active', active);
            });

            const submit = root.querySelector('[data-cloud-submit]');
            const password = root.querySelector('input[name="password"]');

            if (submit) {
                submit.textContent = authMode === 'signup'
                    ? 'Buat akun'
                    : 'Login';
            }

            if (password) {
                password.autocomplete = authMode === 'signup'
                    ? 'new-password'
                    : 'current-password';
            }

            return;
        }

        const button = event.target.closest('[data-cloud-action]');
        if (!button || !root.contains(button) || busy) return;

        const action = button.dataset.cloudAction;
        busy = true;
        setBusy(root, true);

        try {
            if (action === 'upload') {
                const confirmed = window.confirm(
                    'Simpan progres game saat ini ke cloud? ' +
                    'Save cloud yang ada pada slot utama akan diperbarui.'
                );

                if (!confirmed) return;

                // Simpan lokal dahulu agar cloud bukan satu-satunya salinan.
                SaveService.save(state);

                const result = await CloudService.uploadSave(getSavePayload());

                if (!result.ok) {
                    showMessage(root, result.reason, 'error');
                } else {
                    showMessage(
                        root,
                        'Progres berhasil disimpan ke cloud.',
                        'success'
                    );
                }
            }

            if (action === 'download') {
                const confirmed = window.confirm(
                    'Muat progres dari cloud? Progres lokal yang sedang ' +
                    'dimainkan akan diganti jika save cloud tersedia.'
                );

                if (!confirmed) return;

                const result = await CloudService.downloadSave();

                if (!result.ok) {
                    showMessage(root, result.reason, 'error');
                } else if (!result.payload) {
                    showMessage(
                        root,
                        'Belum ada save cloud untuk akun ini.',
                        'info'
                    );
                } else {
                    const payload = result.payload;
                    const gameData = payload.data || payload;

                    if (!gameData || typeof gameData !== 'object') {
                        throw new Error('Format save cloud tidak valid.');
                    }

                    state.hydrate(gameData);
                    SaveService.save(state);

                    showMessage(
                        root,
                        'Save cloud berhasil dimuat dan disimpan secara lokal.',
                        'success'
                    );

                    // Beri tahu aplikasi agar tampilan membaca state terbaru.
                    window.__game?.render?.();
                }
            }

            if (action === 'logout') {
                const confirmed = window.confirm(
                    'Keluar dari akun cloud? Save lokal tidak akan dihapus.'
                );

                if (!confirmed) return;

                const result = await CloudService.signOut();

                if (!result.ok) {
                    showMessage(root, result.reason, 'error');
                } else {
                    showMessage(
                        root,
                        'Kamu sudah keluar. Save lokal tetap tersedia.',
                        'success'
                    );
                }
            }
        } catch (error) {
            showMessage(
                root,
                error?.message || 'Terjadi kesalahan.',
                'error'
            );
        } finally {
            busy = false;
            setBusy(root, false);
            refreshPanel(root);
        }
    });

    root.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-cloud-form="auth"]');
        if (!form || !root.contains(form)) return;

        event.preventDefault();
        if (busy) return;

        const formData = new FormData(form);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');

        if (!email || !password) {
            showMessage(root, 'Email dan password wajib diisi.', 'error');
            return;
        }

        busy = true;
        setBusy(root, true);
        showMessage(root, 'Sedang menghubungkan ke Supabase...');

        try {
            const result = authMode === 'signup'
                ? await CloudService.signUp(email, password)
                : await CloudService.signIn(email, password);

            if (!result.ok) {
                showMessage(root, result.reason, 'error');
            } else if (result.needsConfirmation) {
                showMessage(
                    root,
                    'Akun berhasil dibuat. Periksa email untuk konfirmasi, ' +
                    'lalu login setelah akun dikonfirmasi.',
                    'success'
                );
            } else {
                showMessage(
                    root,
                    authMode === 'signup'
                        ? 'Akun berhasil dibuat dan terhubung.'
                        : 'Login berhasil.',
                    'success'
                );
            }
        } catch (error) {
            showMessage(
                root,
                error?.message || 'Autentikasi gagal.',
                'error'
            );
        } finally {
            busy = false;
            setBusy(root, false);
            refreshPanel(root);
        }
    });
}

