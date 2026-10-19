import { sb, checkAdmin } from './admin.js';
const $ = s => document.querySelector(s);
const form = $('#f'), msg = $('#msg'), btn = $('#go');
let fails = 0, lockUntil = 0;

if (await checkAdmin()) location.replace('../dashboard/');

$('#eye').onclick = e => {
    const p = $('#pw'), show = p.type === 'password';
    p.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Sembunyikan' : 'Lihat';
};

form.onsubmit = async e => {
    e.preventDefault();
    const wait = Math.ceil((lockUntil - Date.now()) / 1000);
    if (wait > 0) { msg.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${wait} detik.`; return; }
    btn.disabled = true; msg.className = 'msg muted'; msg.textContent = 'Memeriksa akun…';
    const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    if (!error && await checkAdmin()) { location.replace('../dashboard/'); return; }
    if (!error) await sb.auth.signOut();
    fails++; if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; }
    msg.className = 'msg err';
    msg.textContent = error && /rate|429/i.test(error.message) ? 'Terlalu banyak percobaan. Tunggu beberapa menit.' : 'Email atau kata sandi salah, atau akun ini bukan admin.';
    btn.disabled = false; $('#pw').value = ''; $('#pw').focus();
};
