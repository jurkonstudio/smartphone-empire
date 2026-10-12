// FILE: src/main.js — TES MINIMAL
console.log('MAIN.JS LOADED');

const ls = document.getElementById('loading-screen');
if (ls) ls.style.display = 'none';

const view = document.getElementById('app-view');
if (view) {
    view.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#4CAF50;font-size:20px;font-family:sans-serif;">✅ main.js berhasil dimuat</div>';
}
