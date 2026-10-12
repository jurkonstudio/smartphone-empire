// FILE: src/data/marketing.data.js
// ============================================================
// KAMPANYE PEMASARAN
// Efek pemasaran bergantung pada jumlah Marketer dan biaya.
// ============================================================

export const MARKETING_CAMPAIGNS = [
    {
        id: 'ads_online',
        name: 'Iklan Online',
        description: 'Banner dan iklan display di web.',
        cost: 3000,
        durationDays: 14,
        reachBase: 0.10,
        appealBonus: 5
    },
    {
        id: 'ads_sponsor',
        name: 'Sponsor Event',
        description: 'Sponsor acara teknologi atau olahraga.',
        cost: 8000,
        durationDays: 21,
        reachBase: 0.15,
        appealBonus: 8
    },
    {
        id: 'ads_launch',
        name: 'Peluncuran Produk',
        description: 'Event peluncuran besar dengan media.',
        cost: 15000,
        durationDays: 7,
        reachBase: 0.25,
        appealBonus: 15
    },
    {
        id: 'ads_billboard',
        name: 'Billboard Kota',
        description: 'Iklan billboard di kota besar.',
        cost: 12000,
        durationDays: 30,
        reachBase: 0.18,
        appealBonus: 10
    },
    {
        id: 'ads_influencer',
        name: 'Kampanye Influencer',
        description: 'Review dari influencer teknologi.',
        cost: 25000,
        durationDays: 14,
        reachBase: 0.35,
        appealBonus: 20
    }
];

export function getCampaignById(id) {
    return MARKETING_CAMPAIGNS.find(c => c.id === id) || null;
}
