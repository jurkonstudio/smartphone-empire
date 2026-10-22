// FILE: src/systems/LiveProjection.js  (BARU)
// Proyeksi "live count" untuk tampilan (stok produk & pengguna aktif OS).
// Penjualan tetap diproses per hari game; modul ini hanya menghitung angka
// yang ditampilkan di antara dua tick harian. Tidak mengubah state.
import { TIME_CONFIG } from '../config/time.config.js';
import { computeOsAdoption } from './OsAdoptionModel.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export const LIVE_CONFIG = {
    rateWindowDays: 3,   // laju = rata-rata penjualan 3 hari terakhir
    easeMs: 180,         // konstanta waktu tween tampilan (ms)
    snapRatio: 0.35,     // lompatan > 35% dari target langsung di-snap
    epsilon: 0.05
};

export function dayFraction(time) {
    if (!time) return 0;
    const minutes = (Number(time.currentHour) || 0) * TIME_CONFIG.minutesPerHour + (Number(time.currentMinute) || 0);
    return Math.min(1, Math.max(0, minutes / MINUTES_PER_DAY));
}

export function dailySoldRate(p, windowDays) {
    const w = windowDays || LIVE_CONFIG.rateWindowDays;
    if (!p || p.status !== 'selling' || !(p.stock > 0)) return 0;
    const hist = Array.isArray(p.dailySales) ? p.dailySales.slice(-w) : [];
    if (!hist.length) return 0;
    let sum = 0;
    for (let i = 0; i < hist.length; i++) sum += Number(hist[i] && hist[i].sold) || 0;
    return sum / hist.length;
}

export function projectedStock(p, time) {
    if (!p) return 0;
    const stock = Number(p.stock) || 0;
    const rate = dailySoldRate(p);
    if (rate <= 0) return stock;
    return Math.max(0, stock - rate * dayFraction(time));
}

export function projectedOsAdoption(data) {
    data = data || {};
    const catalog = (data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];
    const frac = dayFraction(data.time);
    const view = catalog.map(function (p) {
        const opt = (p.config && p.config.osOptionId) || '';
        const extra = opt.indexOf('own:') === 0 ? dailySoldRate(p) * frac : 0;
        return { id: p.id, name: p.name, config: p.config, totalSold: (Number(p.totalSold) || 0) + extra };
    });
    return computeOsAdoption({ os: data.os, time: data.time, products: { catalog: view } });
}

// Mendekati target secara halus; langsung snap bila lompatan besar (restock, rilis).
export function easeTowards(current, target, dtMs) {
    const diff = target - current;
    const abs = Math.abs(diff);
    if (abs <= LIVE_CONFIG.epsilon) return target;
    if (abs > Math.max(1, Math.abs(target)) * LIVE_CONFIG.snapRatio) return target;
    const k = 1 - Math.exp(-Math.max(0, dtMs) / LIVE_CONFIG.easeMs);
    return current + diff * k;
}
