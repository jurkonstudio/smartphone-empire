// FILE: src/core/AudioService.js
// v2028.31 — Path disesuaikan dengan folder 'assets' dan file 'succes.mp3'.

var _enabled = false;
var _unlocked = false;

// ============================================================
// DAFTAR SUARA (Sesuai dengan folder GitHub kamu saat ini)
// ============================================================
var SOUNDS = {
    tap:     './assets/audio/tap.mp3',
    toggle:  './assets/audio/toggle.mp3',
    success: './assets/audio/succes.mp3', // Sesuai dengan typo di file-mu
    error:   './assets/audio/error.mp3',
    select:  './assets/audio/select.mp3'  // Biarkan saja, jika tidak ada hanya muncul warning
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

            // Pemanasan browser: putar semua audio dalam keadaan MUTE, lalu pause.
            // Tanpa muted, setiap suara sempat berbunyi saat sentuhan pertama walaupun
            // Efek Suara sedang mati (bug: "ada bunyi saat app baru dibuka").
            for (var k in _cache) {
                (function (a) {
                    a.muted = true;
                    var pr = a.play();
                    var done = function () { a.pause(); a.currentTime = 0; a.muted = false; };
                    if (pr && pr.then) pr.then(done).catch(function () { a.muted = false; });
                    else done();
                })(_cache[k]);
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
        if (!audio) return;
        audio.muted = false; // pemanasan mungkin belum selesai; pastikan suara sungguhan terdengar

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
