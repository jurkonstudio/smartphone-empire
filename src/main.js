// TES DIAGNOSTIK: Memuat satu per satu file untuk melihat mana yang error
console.log("Memulai diagnosa...");

async function testImports() {
    const files = [
        './config/app.config.js',
        './config/constants.js',
        './core/EventBus.js',
        './core/GameState.js',
        './ui/layout/Header.js',
        './ui/layout/Sidebar.js',
        './ui/layout/MobileNav.js',
        './ui/panels/DashboardPanel.js',
        './ui/panels/EmptyState.js'
    ];

    for (const file of files) {
        try {
            await import(file);
            console.log(`✅ SUKSES: ${file}`);
        } catch (error) {
            console.error(`❌ GAGAL: ${file} -> ${error.message}`);
            // Tampilkan di layar HP
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerHTML += `❌ Gagal memuat: <b>${file}</b><br>Alasan: ${error.message}<br><br>`;
            }
        }
    }
    
    // Sembunyikan loading setelah tes selesai
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';
    
    // Sembunyikan pesan error jika semua sukses
    const errorDiv = document.getElementById('error-message');
    if (errorDiv && errorDiv.innerHTML === '') {
        errorDiv.style.display = 'none';
    }
}

testImports();
