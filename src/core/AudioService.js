// FILE: src/core/AudioService.js
// v2028.29 — [FIX] Menambahkan Audio Unlocker untuk kebijakan Autoplay HP & Path resolver.

var _enabled = false;
var _audioCtx = null;
var _unlocked = false;

// ============================================================
// DAFTAR SUARA (Sesuaikan path-nya dengan lokasi file di GitHub)
// Jika kamu taruh di folder root, gunakan './click.mp3'
// Jika di folder assets/audio/, gunakan './assets/audio/click.mp3'
// ============================================================
var SOUNDS = {
    tap:     './assets/audio/tap.mp3',     // Suara klik biasa
    select:  './assets/audio/select.mp3',  // Suara pilih menu
    toggle:  './assets/audio/toggle.mp3',  // Suara switch
    success: './assets/audio/success.mp3', // Suara berhasil (misal: Top Up)
    error:   './assets/audio/error.mp3'    // Suara error/gagal
};

var _cache = {};

export const AudioService = {
    init: function () {
        // 1. Siapkan objek audio
        for (var key in SOUNDS) {
            var audio = new Audio();
            audio.src = SOUNDS[key];
            audio.preload = 'auto';
            _cache[key] = audio;
        }

        // 2. Buka kunci audio pada interaksi pertama (Wajib untuk iOS/Android)
        var unlockAudio = function () {
            if (_unlocked) return;
            _unlocked = true;

            // Putar file kosong/silence untuk membuka izin browser
            var silentAudio = new Audio('data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL+RZhYXBwbA==');
            silentAudio.play().catch(function () {});

            // Putar semua audio dalam keadaan mute sesaat untuk "memanaskan" browser
            for (var k in _cache) {
                _cache[k].play().then(function(a) {
                    a.pause();
                    a.currentTime = 0;
                }).catch(function () {});
            }

            console.info('[AudioService] Audio berhasil dibuka (Unlocked)');
            
            // Hapus listener setelah berhasil
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        // Daftarkan listener (menunggu pemain menyentuh layar)
        document.addEventListener('touchstart', unlockAudio, { passive: true });
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
    },

    setEnabled: function (isEnabled) {
        _enabled = !!isEnabled;
        console.info('[AudioService] Audio diatur ke:', _enabled ? 'AKTIF' : 'MATI');
    },

    play: function (id) {
        if (!_enabled) return; // Jika pemain mematikan suara di Setelan
        if (!_unlocked) return; // Jika browser belum dibuka kuncinya

        var audio = _cache[id];
        if (!audio) {
            console.warn('[AudioService] Suara tidak ditemukan:', id);
            return;
        }

        try {
            // Reset waktu agar bisa diputar berulang kali dengan cepat
            audio.currentTime = 0;
            var playPromise = audio.play();
            
            // Tangkap error jika file tidak ada (404) atau format tidak didukung
            if (playPromise !== undefined) {
                playPromise.catch(function (error) {
                    console.warn('[AudioService] Gagal memutar ' + id + ':', error.message);
                });
            }
        } catch (e) {
            console.warn('[AudioService] Error memutar audio:', e);
        }
    }
};
