// FILE: src/data/stocks.data.js
// ============================================================
// DATA SAHAM HISTORIS — untuk halaman Exchange di HQ.
// v2027.1a — Sesi 1: display only.
//
// Prinsip:
// - Angka adalah PIVOT TAHUNAN dari sumber publik (close tahunan).
// - Bulan di antara pivot diinterpolasi halus oleh StockSystem.
// - Kalau emiten punya data terbatas, tetap dipakai apa adanya.
//
// Catatan emiten yang di-skip karena tidak listed publik:
// Huawei, Oppo, Vivo, OnePlus, Honor, Nothing, Microsoft Lumia.
// ============================================================

export const STOCKS = [
    {
        id: 'nokia',
        ticker: 'NOK',
        name: 'Nokia Corporation',
        competitorId: 'nokia',
        country: 'Finlandia',
        listedFrom: 1999,
        listedTo: 2014,
        currency: 'USD',
        priceByYear: {
            1999: 22.81, 2000: 20.85, 2001: 14.11, 2002: 8.50,
            2003: 12.50, 2004: 15.20, 2005: 17.50, 2006: 18.90,
            2007: 20.99, 2008: 8.77, 2009: 7.50, 2010: 6.30,
            2011: 3.13, 2012: 2.76, 2013: 5.68, 2014: 5.86
        }
    },
    {
        id: 'motorola',
        ticker: 'MOT',
        name: 'Motorola, Inc.',
        competitorId: 'motorola',
        country: 'Amerika Serikat',
        listedFrom: 1999,
        listedTo: 2011,
        currency: 'USD',
        priceByYear: {
            1999: 143.16, 2000: 58.66, 2001: 43.99, 2002: 24.85,
            2003: 38.45, 2004: 51.40, 2005: 78.63, 2006: 70.51,
            2007: 55.61, 2008: 15.78, 2009: 26.21, 2010: 29.77, 2011: 36.20
        }
    },
    {
        id: 'blackberry',
        ticker: 'BB',
        name: 'Research In Motion',
        competitorId: 'blackberry',
        country: 'Kanada',
        listedFrom: 1999,
        listedTo: 2016,
        currency: 'USD',
        priceByYear: {
            1999: 3.50, 2000: 5.42, 2001: 2.20, 2002: 1.18,
            2003: 5.75, 2004: 13.69, 2005: 11.40, 2006: 21.87,
            2007: 57.88, 2008: 20.65, 2009: 33.27, 2010: 29.34,
            2011: 7.22, 2012: 5.53, 2013: 3.51, 2014: 5.04,
            2015: 4.32, 2016: 3.26
        }
    },
    {
        id: 'samsung',
        ticker: '005930.KS',
        name: 'Samsung Electronics',
        competitorId: 'samsung',
        country: 'Korea Selatan',
        listedFrom: 1999,
        listedTo: null,
        currency: 'KRW',
        priceByYear: {
            1999: 6110, 2000: 6110, 2001: 9000, 2002: 13185,
            2003: 16850, 2004: 18270, 2005: 27375, 2006: 29100,
            2007: 27200, 2008: 14750, 2009: 29000, 2010: 34800,
            2011: 39950, 2012: 60000, 2013: 58600, 2014: 51700,
            2015: 47500, 2016: 65480, 2017: 101950, 2018: 77150,
            2019: 99250, 2020: 146350, 2021: 143000, 2022: 99300,
            2023: 102700, 2024: 78500, 2026: 155000
        }
    },
    {
        id: 'htc',
        ticker: '2498.TW',
        name: 'HTC Corporation',
        competitorId: 'htc',
        country: 'Taiwan',
        listedFrom: 2006,
        listedTo: 2019,
        currency: 'TWD',
        priceByYear: {
            2006: 1220, 2007: 1476, 2008: 790, 2009: 700,
            2010: 900, 2011: 1300, 2012: 350, 2013: 250,
            2014: 180, 2015: 80, 2016: 70, 2017: 55,
            2018: 40, 2019: 35
        }
    },
    {
        id: 'apple',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        competitorId: 'apple',
        country: 'Amerika Serikat',
        listedFrom: 2007,
        listedTo: null,
        currency: 'USD',
        priceByYear: {
            2007: 7.00, 2008: 2.79, 2009: 6.47, 2010: 9.75,
            2011: 11.98, 2012: 15.65, 2013: 16.39, 2014: 23.38,
            2015: 22.89, 2016: 25.72, 2017: 38.09, 2018: 35.41,
            2019: 66.83, 2020: 119.14, 2021: 164.48, 2022: 118.06,
            2023: 160.54, 2024: 217.68, 2026: 273.08
        }
    },
    {
        id: 'xiaomi',
        ticker: '1810.HK',
        name: 'Xiaomi Corporation',
        competitorId: 'xiaomi',
        country: 'Tiongkok',
        listedFrom: 2018,
        listedTo: null,
        currency: 'HKD',
        priceByYear: {
            2018: 17.00, 2019: 8.28, 2020: 20.00, 2021: 25.00,
            2022: 11.00, 2023: 14.00, 2024: 35.90, 2026: 42.00
        }
    },
    {
        id: 'jsi',
        ticker: 'JSI',
        name: 'Player Company',
        competitorId: null,
        country: null,
        isPlayer: true,
        listedFrom: null,
        listedTo: null,
        currency: 'USD',
        priceByYear: null
    }
];

export const MARKET_INDICES = [
    {
        id: 'nasdaq',
        ticker: 'IXIC',
        name: 'NASDAQ Composite',
        region: 'US',
        valueByYear: {
            1999: 4069.31, 2000: 2470.52, 2001: 1950.40, 2002: 1335.51,
            2003: 2003.37, 2004: 2175.44, 2005: 2205.32, 2006: 2415.29,
            2007: 2652.28, 2008: 1577.03, 2009: 2269.15, 2010: 2652.87,
            2011: 2605.15, 2012: 3019.51, 2013: 4176.59, 2014: 4736.05,
            2015: 5007.41, 2016: 5383.12, 2017: 6903.39, 2018: 6635.28,
            2019: 8972.60, 2020: 12888.28, 2021: 15644.97, 2022: 10466.48,
            2023: 15011.35, 2024: 19555.00, 2026: 23000.00
        }
    },
    {
        id: 'dow',
        ticker: 'DJI',
        name: 'Dow Jones Industrial',
        region: 'US',
        valueByYear: {
            1999: 11497.12, 2000: 10786.85, 2001: 10021.50, 2002: 8341.63,
            2003: 10453.92, 2004: 10783.01, 2005: 10717.50, 2006: 12463.15,
            2007: 13264.82, 2008: 8776.39, 2009: 10428.05, 2010: 11577.51,
            2011: 12217.56, 2012: 13104.14, 2013: 16576.66, 2014: 17823.07,
            2015: 17425.03, 2016: 19762.60, 2017: 24719.22, 2018: 23327.46,
            2019: 28538.44, 2020: 30606.48, 2021: 36338.30, 2022: 33147.25,
            2023: 37689.54, 2024: 42544.22, 2026: 48000.00
        }
    },
    {
        id: 'sp500',
        ticker: 'GSPC',
        name: 'S&P 500',
        region: 'US',
        valueByYear: {
            1999: 1469.25, 2000: 1320.28, 2001: 1148.08, 2002: 879.82,
            2003: 1111.92, 2004: 1211.92, 2005: 1248.29, 2006: 1418.30,
            2007: 1468.36, 2008: 903.25, 2009: 1115.10, 2010: 1257.64,
            2011: 1257.60, 2012: 1426.19, 2013: 1848.36, 2014: 2058.90,
            2015: 2043.94, 2016: 2238.83, 2017: 2673.61, 2018: 2506.85,
            2019: 3230.78, 2020: 3756.07, 2021: 4766.18, 2022: 3839.50,
            2023: 4769.83, 2024: 5881.63, 2026: 6600.00
        }
    }
];

export function getStockById(id) {
    return STOCKS.find(s => s.id === id) || null;
}

export function getIndexById(id) {
    return MARKET_INDICES.find(i => i.id === id) || null;
}

export function getStocksForYear(year) {
    return STOCKS.filter(s => {
        if (s.isPlayer) return false;
        if (year < s.listedFrom) return false;
        if (s.listedTo !== null && year > s.listedTo) return false;
        return true;
    });
}
