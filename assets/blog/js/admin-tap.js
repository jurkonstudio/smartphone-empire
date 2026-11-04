// 7x ketuk tersembunyi pada logo header -> dialog login admin.
// Skrip biasa (bukan module) supaya tetap jalan walau CDN Supabase gagal dimuat.
(function () {
  var NEED = 7, GAP = 2000, n = 0, last = 0;
  var el = document.getElementById('brand');
  if (!el) return;
  function say(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3000);
  }
  function openAdminLogin() {
    window.__adminLogin = true;
    document.getElementById('loginTabs').hidden = true;
    document.getElementById('btnForgot').hidden = true;
    document.getElementById('loginHint').textContent = 'Khusus admin.';
    document.getElementById('loginTitle').textContent = 'Masuk admin';
    document.getElementById('btnDoLogin').textContent = 'Masuk';
    document.getElementById('loginPassWrap').hidden = false;
    document.getElementById('loginPass').required = true;
    var st = document.getElementById('loginStatus'); st.textContent = '';
    var dlg = document.getElementById('dlgLogin');
    if (!dlg.open) dlg.showModal();
    document.getElementById('loginEmail').focus();
    setTimeout(function () {
      if (!window.__blogReady) st.textContent = 'Koneksi ke server gagal (Supabase tidak termuat). Cek internet lalu muat ulang halaman.';
    }, 1500);
  }
  el.addEventListener('click', function (e) {
    var now = Date.now();
    n = (now - last > GAP) ? 1 : n + 1;
    last = now;
    if (n < NEED) return;
    n = 0;
    e.preventDefault();
    var bar = document.getElementById('adminbar');
    if (bar && !bar.hidden) { say('Kamu sudah masuk sebagai admin.'); return; }
    openAdminLogin();
  });
})();
