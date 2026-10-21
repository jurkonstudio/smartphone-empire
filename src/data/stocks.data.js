// FILE: src/data/stocks.data.js
// ============================================================
// DATA SAHAM HISTORIS — untuk halaman Exchange di HQ.
// v2027.4b — +emiten global & IDX, +indeks dunia, tier ukuran emiten.
//
// Ticker = gaya IDX (4 huruf). realTicker = kode bursa asli.
// Harga split-adjusted untuk grafik yang konsisten.
//
// Tingkat kepercayaan data:
//   [verified]  — angka publik yang saya yakini.
//   [trend]     — kurva tren realistis, angka perkiraan.
//   [fictional] — emiten fiktif untuk gameplay.
// ============================================================

export const STOCKS = [
    // ==================== PHONE (9) ====================
    { id: 'nokia', ticker: 'NOKI', realTicker: 'NOK', name: 'Nokia Corporation',
      competitorId: 'nokia', category: 'phone', country: 'Finlandia',
      listedFrom: 1999, listedTo: 2014, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 22.81, 2000: 20.85, 2001: 14.11, 2002: 8.50,
          2003: 12.50, 2004: 15.20, 2005: 17.50, 2006: 18.90,
          2007: 20.99, 2008: 8.77, 2009: 7.50, 2010: 6.30,
          2011: 3.13, 2012: 2.76, 2013: 5.68, 2014: 5.86
      } },
    { id: 'motorola', ticker: 'MOTR', realTicker: 'MOT', name: 'Motorola, Inc.',
      competitorId: 'motorola', category: 'phone', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: 2011, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 143.16, 2000: 58.66, 2001: 43.99, 2002: 24.85,
          2003: 38.45, 2004: 51.40, 2005: 78.63, 2006: 70.51,
          2007: 55.61, 2008: 15.78, 2009: 26.21, 2010: 29.77, 2011: 36.20
      } },
    { id: 'blackberry', ticker: 'BBRY', realTicker: 'BB', name: 'Research In Motion',
      competitorId: 'blackberry', category: 'phone', country: 'Kanada',
      listedFrom: 1999, listedTo: 2016, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 3.50, 2000: 5.42, 2001: 2.20, 2002: 1.18,
          2003: 5.75, 2004: 13.69, 2005: 11.40, 2006: 21.87,
          2007: 57.88, 2008: 20.65, 2009: 33.27, 2010: 29.34,
          2011: 7.22, 2012: 5.53, 2013: 3.51, 2014: 5.04,
          2015: 4.32, 2016: 3.26
      } },
    { id: 'samsung', ticker: 'SMSG', realTicker: '005930.KS', name: 'Samsung Electronics',
      competitorId: 'samsung', category: 'phone', country: 'Korea Selatan',
      listedFrom: 1999, listedTo: null, currency: 'KRW', confidence: 'verified',
      priceByYear: {
          1999: 6110, 2000: 6110, 2001: 9000, 2002: 13185,
          2003: 16850, 2004: 18270, 2005: 27375, 2006: 29100,
          2007: 27200, 2008: 14750, 2009: 29000, 2010: 34800,
          2011: 39950, 2012: 60000, 2013: 58600, 2014: 51700,
          2015: 47500, 2016: 65480, 2017: 101950, 2018: 77150,
          2019: 99250, 2020: 146350, 2021: 143000, 2022: 99300,
          2023: 102700, 2024: 78500, 2026: 155000
      } },
    { id: 'htc', ticker: 'HTCC', realTicker: '2498.TW', name: 'HTC Corporation',
      competitorId: 'htc', category: 'phone', country: 'Taiwan',
      listedFrom: 2006, listedTo: 2019, currency: 'TWD', confidence: 'trend',
      priceByYear: {
          2006: 1220, 2007: 1476, 2008: 790, 2009: 700,
          2010: 900, 2011: 1300, 2012: 350, 2013: 250,
          2014: 180, 2015: 80, 2016: 70, 2017: 55,
          2018: 40, 2019: 35
      } },
    { id: 'apple', ticker: 'AAPL', realTicker: 'AAPL', name: 'Apple Inc.',
      competitorId: 'apple', category: 'phone', country: 'Amerika Serikat',
      listedFrom: 2007, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2007: 7.00, 2008: 2.79, 2009: 6.47, 2010: 9.75,
          2011: 11.98, 2012: 15.65, 2013: 16.39, 2014: 23.38,
          2015: 22.89, 2016: 25.72, 2017: 38.09, 2018: 35.41,
          2019: 66.83, 2020: 119.14, 2021: 164.48, 2022: 118.06,
          2023: 160.54, 2024: 217.68, 2026: 273.08
      } },
    { id: 'xiaomi', ticker: 'XIAO', realTicker: '1810.HK', name: 'Xiaomi Corporation',
      competitorId: 'xiaomi', category: 'phone', country: 'Tiongkok',
      listedFrom: 2018, listedTo: null, currency: 'HKD', confidence: 'verified',
      priceByYear: {
          2018: 17.00, 2019: 8.28, 2020: 20.00, 2021: 25.00,
          2022: 11.00, 2023: 14.00, 2024: 35.90, 2026: 42.00
      } },
    // Polytron — FIKSI untuk gameplay (di dunia nyata tidak listed).
    { id: 'polytron', ticker: 'PLTR', realTicker: null, name: 'Polytron (fiktif)',
      competitorId: null, category: 'phone', country: 'Indonesia',
      listedFrom: 1999, listedTo: null, currency: 'IDR', confidence: 'fictional',
      priceByYear: {
          1999: 850, 2000: 1200, 2002: 1500, 2005: 2200,
          2008: 1800, 2010: 3200, 2013: 4500, 2015: 5200,
          2018: 6800, 2020: 8500, 2022: 7200, 2024: 9500, 2026: 11000
      } },
    // Erajaya — emiten nyata IDX.
    { id: 'erajaya', ticker: 'ERAA', realTicker: 'ERAA', name: 'Erajaya Swasembada',
      competitorId: null, category: 'phone', country: 'Indonesia',
      listedFrom: 2011, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2011: 800, 2012: 1000, 2013: 1500, 2014: 2000,
          2015: 1400, 2016: 1500, 2017: 1200, 2018: 1000,
          2019: 900, 2020: 1000, 2021: 1200, 2022: 1000,
          2023: 900, 2024: 800, 2026: 850
      } },

    // ==================== CHIP / SEMICONDUCTOR (8) ====================
    { id: 'intel', ticker: 'INTC', realTicker: 'INTC', name: 'Intel Corporation',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 40.00, 2000: 30.00, 2001: 30.00, 2002: 15.00,
          2003: 30.00, 2005: 25.00, 2007: 25.00, 2010: 20.00,
          2012: 20.00, 2015: 35.00, 2018: 45.00, 2020: 60.00,
          2022: 40.00, 2024: 20.00, 2026: 25.00
      } },
    { id: 'nvidia', ticker: 'NVDA', realTicker: 'NVDA', name: 'NVIDIA Corporation',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 0.30, 2000: 1.10, 2002: 0.40, 2005: 0.35,
          2008: 0.35, 2010: 0.60, 2012: 0.65, 2015: 1.50,
          2017: 5.00, 2018: 5.80, 2019: 5.00, 2020: 12.00,
          2021: 30.00, 2022: 15.00, 2023: 50.00, 2024: 130.00, 2026: 160.00
      } },
    { id: 'qualcomm', ticker: 'QCOM', realTicker: 'QCOM', name: 'Qualcomm Inc.',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 150.00, 2000: 65.00, 2002: 35.00, 2005: 40.00,
          2008: 35.00, 2010: 45.00, 2013: 70.00, 2015: 50.00,
          2018: 55.00, 2020: 150.00, 2022: 110.00, 2024: 170.00, 2026: 190.00
      } },
    { id: 'tsmc', ticker: 'TSMC', realTicker: 'TSM', name: 'Taiwan Semiconductor',
      competitorId: null, category: 'chip', country: 'Taiwan',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 4.50, 2000: 20.00, 2002: 7.00, 2005: 8.00,
          2008: 8.00, 2010: 12.00, 2013: 17.00, 2015: 22.00,
          2018: 36.00, 2020: 105.00, 2022: 75.00, 2024: 190.00, 2026: 220.00
      } },
    { id: 'amd', ticker: 'AMDC', realTicker: 'AMD', name: 'Advanced Micro Devices',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 30.00, 2000: 25.00, 2002: 10.00, 2005: 20.00,
          2008: 3.00, 2010: 8.00, 2013: 4.00, 2015: 3.00,
          2017: 10.00, 2020: 90.00, 2022: 65.00, 2024: 150.00, 2026: 180.00
      } },
    { id: 'asml', ticker: 'ASML', realTicker: 'ASML', name: 'ASML Holding',
      competitorId: null, category: 'chip', country: 'Belanda',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 15.00, 2000: 20.00, 2002: 12.00, 2005: 18.00,
          2008: 20.00, 2010: 35.00, 2013: 90.00, 2015: 90.00,
          2018: 170.00, 2020: 450.00, 2022: 550.00, 2024: 700.00, 2026: 900.00
      } },
    { id: 'broadcom', ticker: 'AVGO', realTicker: 'AVGO', name: 'Broadcom Inc.',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 2009, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2009: 25.00, 2012: 35.00, 2015: 130.00, 2018: 200.00,
          2020: 400.00, 2022: 550.00, 2024: 1500.00, 2026: 1800.00
      } },
    { id: 'arm', ticker: 'ARMC', realTicker: 'ARM', name: 'Arm Holdings',
      competitorId: null, category: 'chip', country: 'Inggris',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 5.00, 2002: 3.00, 2005: 4.00, 2008: 5.00,
          2010: 8.00, 2013: 15.00, 2016: 40.00, 2023: 60.00,
          2024: 120.00, 2026: 140.00
      } },

    // ==================== SOFTWARE / INTERNET (5) ====================
    { id: 'microsoft', ticker: 'MSFT', realTicker: 'MSFT', name: 'Microsoft Corporation',
      competitorId: 'microsoft_nokia', category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 58.00, 2000: 23.00, 2002: 22.00, 2005: 25.00,
          2008: 20.00, 2010: 25.00, 2013: 35.00, 2015: 50.00,
          2018: 100.00, 2020: 220.00, 2022: 240.00, 2024: 420.00, 2026: 480.00
      } },
    { id: 'google', ticker: 'GOOG', realTicker: 'GOOG', name: 'Alphabet Inc.',
      competitorId: 'google_android', category: 'software', country: 'Amerika Serikat',
      listedFrom: 2004, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2004: 100.00, 2005: 200.00, 2008: 300.00, 2010: 300.00,
          2012: 350.00, 2015: 700.00, 2018: 1050.00, 2020: 1700.00,
          2021: 2900.00, 2022: 90.00, 2024: 180.00, 2026: 210.00
      } },
    { id: 'amazon', ticker: 'AMZN', realTicker: 'AMZN', name: 'Amazon.com Inc.',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 90.00, 2000: 15.00, 2002: 20.00, 2005: 45.00,
          2008: 75.00, 2010: 180.00, 2013: 400.00, 2015: 670.00,
          2018: 1500.00, 2020: 3200.00, 2022: 84.00, 2024: 200.00, 2026: 240.00
      } },
    { id: 'oracle', ticker: 'ORCL', realTicker: 'ORCL', name: 'Oracle Corporation',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 30.00, 2000: 15.00, 2002: 12.00, 2005: 12.00,
          2008: 18.00, 2010: 30.00, 2013: 35.00, 2015: 40.00,
          2018: 45.00, 2020: 60.00, 2022: 80.00, 2024: 170.00, 2026: 190.00
      } },
    { id: 'adobe', ticker: 'ADBE', realTicker: 'ADBE', name: 'Adobe Inc.',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 30.00, 2000: 20.00, 2002: 15.00, 2005: 30.00,
          2008: 22.00, 2010: 30.00, 2013: 60.00, 2015: 90.00,
          2018: 240.00, 2020: 500.00, 2022: 350.00, 2024: 450.00, 2026: 500.00
      } },

    // ==================== SOCIAL MEDIA (6) ====================
    { id: 'meta', ticker: 'META', realTicker: 'META', name: 'Meta Platforms',
      competitorId: null, category: 'social', country: 'Amerika Serikat',
      listedFrom: 2012, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2012: 27.00, 2013: 55.00, 2015: 105.00, 2017: 175.00,
          2018: 130.00, 2020: 270.00, 2021: 340.00, 2022: 120.00,
          2023: 350.00, 2024: 600.00, 2026: 700.00
      } },
    { id: 'twitter', ticker: 'TWTR', realTicker: 'TWTR', name: 'Twitter Inc.',
      competitorId: null, category: 'social', country: 'Amerika Serikat',
      listedFrom: 2013, listedTo: 2022, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2013: 45.00, 2014: 35.00, 2015: 25.00, 2016: 15.00,
          2017: 25.00, 2018: 30.00, 2019: 30.00, 2020: 55.00,
          2021: 45.00, 2022: 54.00
      } },
    { id: 'snap', ticker: 'SNAP', realTicker: 'SNAP', name: 'Snap Inc.',
      competitorId: null, category: 'social', country: 'Amerika Serikat',
      listedFrom: 2017, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2017: 15.00, 2018: 6.00, 2019: 17.00, 2020: 50.00,
          2021: 45.00, 2022: 10.00, 2023: 15.00, 2024: 12.00, 2026: 15.00
      } },
    { id: 'tencent', ticker: 'TENC', realTicker: '0700.HK', name: 'Tencent Holdings',
      competitorId: null, category: 'social', country: 'Tiongkok',
      listedFrom: 2004, listedTo: null, currency: 'HKD', confidence: 'verified',
      priceByYear: {
          2004: 1.00, 2007: 5.00, 2010: 12.00, 2013: 30.00,
          2015: 100.00, 2017: 400.00, 2018: 300.00, 2020: 560.00,
          2021: 450.00, 2022: 330.00, 2024: 400.00, 2026: 450.00
      } },
    { id: 'baidu', ticker: 'BIDU', realTicker: 'BIDU', name: 'Baidu Inc.',
      competitorId: null, category: 'social', country: 'Tiongkok',
      listedFrom: 2005, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2005: 30.00, 2007: 130.00, 2010: 100.00, 2013: 160.00,
          2015: 200.00, 2017: 230.00, 2018: 160.00, 2020: 140.00,
          2022: 120.00, 2024: 90.00, 2026: 110.00
      } },
    { id: 'spotify', ticker: 'SPOT', realTicker: 'SPOT', name: 'Spotify Technology',
      competitorId: null, category: 'social', country: 'Swedia',
      listedFrom: 2018, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2018: 120.00, 2019: 150.00, 2020: 315.00, 2021: 235.00,
          2022: 80.00, 2023: 190.00, 2024: 500.00, 2026: 550.00
      } },

    // ==================== STREAMING (2) ====================
    { id: 'netflix', ticker: 'NFLX', realTicker: 'NFLX', name: 'Netflix Inc.',
      competitorId: null, category: 'streaming', country: 'Amerika Serikat',
      listedFrom: 2002, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2002: 1.00, 2005: 3.00, 2008: 5.00, 2010: 28.00,
          2013: 52.00, 2015: 115.00, 2018: 267.00, 2020: 520.00,
          2022: 300.00, 2024: 900.00, 2026: 950.00
      } },
    { id: 'reddit', ticker: 'RDDT', realTicker: 'RDDT', name: 'Reddit Inc.',
      competitorId: null, category: 'streaming', country: 'Amerika Serikat',
      listedFrom: 2024, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: { 2024: 50.00, 2026: 150.00 } },

    // ==================== E-COMMERCE (3) ====================
    { id: 'ebay', ticker: 'EBAY', realTicker: 'EBAY', name: 'eBay Inc.',
      competitorId: null, category: 'ecommerce', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 10.00, 2000: 5.00, 2002: 12.00, 2005: 40.00,
          2008: 15.00, 2010: 25.00, 2013: 25.00, 2015: 25.00,
          2018: 30.00, 2020: 45.00, 2022: 40.00, 2024: 65.00, 2026: 70.00
      } },
    { id: 'alibaba', ticker: 'BABA', realTicker: 'BABA', name: 'Alibaba Group',
      competitorId: null, category: 'ecommerce', country: 'Tiongkok',
      listedFrom: 2014, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2014: 100.00, 2015: 80.00, 2017: 170.00, 2018: 140.00,
          2020: 230.00, 2021: 120.00, 2022: 85.00, 2024: 85.00, 2026: 110.00
      } },
    { id: 'shopify', ticker: 'SHOP', realTicker: 'SHOP', name: 'Shopify Inc.',
      competitorId: null, category: 'ecommerce', country: 'Kanada',
      listedFrom: 2015, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2015: 30.00, 2017: 100.00, 2018: 140.00, 2020: 1150.00,
          2021: 1400.00, 2022: 350.00, 2023: 700.00, 2024: 100.00, 2026: 120.00
      } },

    // ==================== OTHER TECH (4) ====================
    { id: 'tesla', ticker: 'TSLA', realTicker: 'TSLA', name: 'Tesla, Inc.',
      competitorId: null, category: 'other', country: 'Amerika Serikat',
      listedFrom: 2010, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          2010: 1.30, 2012: 2.00, 2013: 8.00, 2015: 12.00,
          2017: 22.00, 2019: 13.00, 2020: 235.00, 2021: 350.00,
          2022: 120.00, 2023: 240.00, 2024: 400.00, 2026: 450.00
      } },
    { id: 'sony', ticker: 'SONY', realTicker: 'SONY', name: 'Sony Group',
      competitorId: 'sony_ericsson', category: 'other', country: 'Jepang',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 140.00, 2000: 80.00, 2003: 40.00, 2005: 40.00,
          2008: 30.00, 2010: 30.00, 2013: 15.00, 2015: 25.00,
          2018: 50.00, 2020: 100.00, 2022: 80.00, 2024: 100.00, 2026: 110.00
      } },
    { id: 'ibm', ticker: 'IBMC', realTicker: 'IBM', name: 'IBM Corporation',
      competitorId: null, category: 'other', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 110.00, 2000: 85.00, 2002: 75.00, 2005: 80.00,
          2008: 85.00, 2010: 145.00, 2013: 180.00, 2015: 140.00,
          2018: 120.00, 2020: 125.00, 2022: 140.00, 2024: 220.00, 2026: 250.00
      } },
    { id: 'yahoo', ticker: 'YHOO', realTicker: 'YHOO', name: 'Yahoo! Inc.',
      competitorId: null, category: 'other', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: 2017, currency: 'USD', confidence: 'verified',
      priceByYear: {
          1999: 100.00, 2000: 30.00, 2002: 15.00, 2004: 35.00,
          2006: 25.00, 2008: 12.00, 2010: 16.00, 2012: 20.00,
          2014: 50.00, 2016: 40.00, 2017: 45.00
      } },

    // ==================== PLAYER (1) ====================
    { id: 'jsi', ticker: 'JSIC', realTicker: null, name: 'Player Company',
      competitorId: null, category: 'player', country: null,
      isPlayer: true, listedFrom: null, listedTo: null,
      currency: 'USD', confidence: 'dynamic',
      priceByYear: null },
    // ---- Ponsel & perangkat keras (v2027.4b) ----
    { id: 'lenovo', ticker: 'LENO', realTicker: '0992.HK', name: 'Lenovo Group',
      competitorId: 'lenovo', category: 'phone', country: 'Tiongkok',
      listedFrom: 2005, listedTo: null, currency: 'HKD', confidence: 'trend',
      priceByYear: {
          2005: 3.50, 2008: 4.00, 2010: 4.80, 2013: 5.50,
          2015: 6.50, 2017: 4.80, 2019: 4.70, 2020: 6.00,
          2021: 9.00, 2022: 4.00, 2023: 3.80, 2024: 8.00, 2026: 9.50
      } },
    { id: 'lg', ticker: 'LGEL', realTicker: '066570.KS', name: 'LG Electronics',
      competitorId: 'lg', category: 'phone', country: 'Korea Selatan',
      listedFrom: 2002, listedTo: null, currency: 'KRW', confidence: 'trend',
      priceByYear: {
          2002: 25000, 2005: 60000, 2008: 45000, 2011: 90000,
          2013: 70000, 2016: 55000, 2018: 80000, 2020: 90000,
          2021: 120000, 2022: 90000, 2023: 90000, 2024: 75000, 2026: 85000
      } },
    { id: 'asus', ticker: 'ASUS', realTicker: '2357.TW', name: 'ASUSTeK Computer',
      competitorId: 'asus', category: 'phone', country: 'Taiwan',
      listedFrom: 2000, listedTo: null, currency: 'TWD', confidence: 'trend',
      priceByYear: {
          2000: 400, 2004: 250, 2007: 400, 2010: 300, 2013: 250,
          2015: 200, 2018: 280, 2020: 380, 2021: 400, 2022: 300,
          2024: 500, 2026: 560
      } },
    { id: 'foxconn', ticker: 'FOXC', realTicker: '2317.TW', name: 'Hon Hai (Foxconn)',
      competitorId: null, category: 'other', country: 'Taiwan',
      listedFrom: 1999, listedTo: null, currency: 'TWD', confidence: 'trend',
      priceByYear: {
          1999: 60, 2002: 50, 2005: 120, 2008: 90, 2011: 100,
          2015: 70, 2018: 70, 2020: 110, 2021: 100, 2022: 100,
          2024: 105, 2026: 120
      } },
    { id: 'logitech', ticker: 'LOGI', realTicker: 'LOGI', name: 'Logitech International',
      competitorId: null, category: 'other', country: 'Swiss',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 15, 2002: 15, 2005: 30, 2008: 18, 2011: 16,
          2014: 15, 2017: 40, 2020: 100, 2022: 60, 2024: 90, 2026: 95
      } },
    { id: 'dell', ticker: 'DELL', realTicker: 'DELL', name: 'Dell Technologies',
      competitorId: null, category: 'other', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 40, 2000: 30, 2002: 20, 2005: 30, 2008: 25,
          2010: 17, 2013: 14, 2015: 14, 2018: 45, 2020: 60,
          2022: 45, 2024: 110, 2026: 120
      } },
    { id: 'hp', ticker: 'HPQI', realTicker: 'HPQ', name: 'Hewlett-Packard / HP Inc.',
      competitorId: null, category: 'other', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 60, 2002: 20, 2005: 40, 2008: 40, 2010: 40,
          2012: 22, 2014: 35, 2016: 15, 2018: 20, 2020: 20,
          2022: 28, 2024: 32, 2026: 35
      } },

    // ---- Chip & semikonduktor tambahan (v2027.4b) ----
    { id: 'ti', ticker: 'TXNI', realTicker: 'TXN', name: 'Texas Instruments',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 40, 2000: 80, 2002: 20, 2005: 30, 2008: 22,
          2010: 28, 2013: 45, 2015: 55, 2018: 110, 2020: 150,
          2022: 170, 2024: 200, 2026: 210
      } },
    { id: 'micron', ticker: 'MUIC', realTicker: 'MU', name: 'Micron Technology',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 30, 2000: 80, 2002: 5, 2005: 10, 2008: 7,
          2010: 9, 2013: 13, 2015: 18, 2017: 40, 2018: 52,
          2019: 40, 2020: 50, 2021: 80, 2022: 60, 2023: 60,
          2024: 110, 2026: 150
      } },
    { id: 'adi', ticker: 'ADIC', realTicker: 'ADI', name: 'Analog Devices',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 30, 2001: 30, 2003: 25, 2005: 35, 2008: 25,
          2010: 40, 2013: 50, 2015: 55, 2018: 90, 2020: 130,
          2022: 180, 2024: 210, 2026: 230
      } },
    { id: 'wdc', ticker: 'WDCC', realTicker: 'WDC', name: 'Western Digital',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 6, 2001: 3, 2003: 5, 2005: 6, 2008: 4,
          2010: 36, 2011: 35, 2013: 60, 2015: 75, 2017: 90,
          2018: 60, 2019: 50, 2020: 55, 2022: 45, 2024: 65, 2026: 80
      } },
    { id: 'st', ticker: 'STMI', realTicker: 'STM', name: 'STMicroelectronics',
      competitorId: null, category: 'chip', country: 'Swiss',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 25, 2000: 60, 2002: 15, 2005: 15, 2008: 8,
          2010: 9, 2013: 7, 2015: 13, 2018: 20, 2020: 30,
          2022: 40, 2024: 30, 2026: 35
      } },
    { id: 'sandisk', ticker: 'SNDK', realTicker: 'SNDK', name: 'Sandisk Corporation',
      competitorId: null, category: 'chip', country: 'Amerika Serikat',
      listedFrom: 2025, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: { 2025: 40, 2026: 120 } },

    // ---- Perangkat lunak & platform (v2027.4b) ----
    { id: 'cisco', ticker: 'CSCO', realTicker: 'CSCO', name: 'Cisco Systems',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 80, 2000: 55, 2002: 15, 2005: 20, 2008: 25,
          2010: 22, 2013: 25, 2015: 28, 2018: 45, 2020: 55,
          2022: 50, 2024: 55, 2026: 60
      } },
    { id: 'sap', ticker: 'SAPG', realTicker: 'SAP', name: 'SAP SE',
      competitorId: null, category: 'software', country: 'Jerman',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 40, 2000: 60, 2002: 15, 2005: 25, 2008: 30,
          2010: 40, 2013: 60, 2015: 70, 2018: 110, 2020: 130,
          2022: 110, 2024: 220, 2026: 260
      } },
    { id: 'salesforce', ticker: 'CRMF', realTicker: 'CRM', name: 'Salesforce Inc.',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 2004, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2004: 15, 2006: 25, 2008: 60, 2010: 60, 2013: 50,
          2015: 65, 2018: 130, 2020: 220, 2021: 260, 2022: 170,
          2023: 210, 2024: 290, 2026: 320
      } },
    { id: 'intuit', ticker: 'INTU', realTicker: 'INTU', name: 'Intuit Inc.',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 35, 2000: 45, 2002: 25, 2005: 35, 2008: 25,
          2010: 40, 2013: 60, 2015: 90, 2018: 200, 2020: 300,
          2022: 400, 2024: 600, 2026: 680
      } },
    { id: 'zoom', ticker: 'ZOOM', realTicker: 'ZM', name: 'Zoom Video Communications',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 2019, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2019: 65, 2020: 250, 2021: 330, 2022: 150,
          2023: 65, 2024: 70, 2026: 75
      } },

    // ---- Media sosial tambahan (v2027.4b) ----
    { id: 'pinterest', ticker: 'PINS', realTicker: 'PINS', name: 'Pinterest Inc.',
      competitorId: null, category: 'social', country: 'Amerika Serikat',
      listedFrom: 2019, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2019: 15, 2020: 30, 2021: 40, 2022: 30,
          2023: 30, 2024: 30, 2026: 35
      } },

    // ---- E-commerce, mobilitas & layanan digital (v2027.4b) ----
    { id: 'uber', ticker: 'UBER', realTicker: 'UBER', name: 'Uber Technologies',
      competitorId: null, category: 'software', country: 'Amerika Serikat',
      listedFrom: 2019, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2019: 41, 2020: 40, 2021: 45, 2022: 30,
          2023: 60, 2024: 75, 2026: 90
      } },
    { id: 'airbnb', ticker: 'ABNB', realTicker: 'ABNB', name: 'Airbnb Inc.',
      competitorId: null, category: 'ecommerce', country: 'Amerika Serikat',
      listedFrom: 2020, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2020: 68, 2021: 150, 2022: 115, 2023: 130,
          2024: 140, 2026: 160
      } },
    { id: 'booking', ticker: 'BKNG', realTicker: 'BKNG', name: 'Booking Holdings',
      competitorId: null, category: 'ecommerce', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 20, 2002: 4, 2005: 45, 2008: 35, 2010: 200,
          2013: 1000, 2015: 1400, 2018: 1900, 2020: 1500,
          2022: 2000, 2024: 4000, 2026: 4500
      } },
    { id: 'jdcom', ticker: 'JDCO', realTicker: 'JD', name: 'JD.com Inc.',
      competitorId: null, category: 'ecommerce', country: 'Tiongkok',
      listedFrom: 2014, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2014: 25, 2015: 30, 2017: 35, 2018: 25, 2020: 90,
          2021: 60, 2022: 40, 2023: 30, 2024: 30, 2026: 35
      } },
    { id: 'pdd', ticker: 'PDDH', realTicker: 'PDD', name: 'PDD Holdings (Temu)',
      competitorId: null, category: 'ecommerce', country: 'Tiongkok',
      listedFrom: 2018, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2018: 30, 2019: 40, 2020: 80, 2021: 140, 2022: 60,
          2023: 120, 2024: 130, 2026: 120
      } },
    { id: 'sea', ticker: 'SEAL', realTicker: 'SE', name: 'Sea Limited (Shopee)',
      competitorId: null, category: 'ecommerce', country: 'Singapura',
      listedFrom: 2017, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2017: 25, 2018: 40, 2019: 40, 2020: 200, 2021: 340,
          2022: 50, 2023: 60, 2024: 110, 2026: 140
      } },
    { id: 'mercadolibre', ticker: 'MELI', realTicker: 'MELI', name: 'MercadoLibre',
      competitorId: null, category: 'ecommerce', country: 'Amerika Latin',
      listedFrom: 2007, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2007: 15, 2010: 80, 2013: 150, 2015: 100, 2018: 300,
          2020: 1500, 2021: 1700, 2022: 1000, 2023: 1400, 2024: 2000, 2026: 2100
      } },
    { id: 'coupang', ticker: 'CPNG', realTicker: 'CPNG', name: 'Coupang Inc.',
      competitorId: null, category: 'ecommerce', country: 'Korea Selatan',
      listedFrom: 2021, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: { 2021: 40, 2022: 25, 2023: 15, 2024: 25, 2026: 30 } },

    // ---- Keuangan & pembayaran (v2027.4b) ----
    { id: 'paypal', ticker: 'PYPL', realTicker: 'PYPL', name: 'PayPal Holdings',
      competitorId: null, category: 'finance', country: 'Amerika Serikat',
      listedFrom: 2015, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2015: 40, 2016: 40, 2018: 90, 2020: 200, 2021: 300,
          2022: 80, 2023: 65, 2024: 70, 2026: 80
      } },
    { id: 'block', ticker: 'XYZB', realTicker: 'XYZ', name: 'Block Inc. (Square)',
      competitorId: null, category: 'finance', country: 'Amerika Serikat',
      listedFrom: 2015, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2015: 15, 2018: 25, 2020: 120, 2021: 250, 2022: 90,
          2023: 70, 2024: 75, 2026: 80
      } },
    { id: 'jpmorgan', ticker: 'JPMC', realTicker: 'JPM', name: 'JPMorgan Chase',
      competitorId: null, category: 'finance', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 40, 2000: 40, 2002: 30, 2005: 35, 2008: 30,
          2010: 40, 2013: 55, 2015: 60, 2018: 110, 2020: 110,
          2021: 150, 2022: 135, 2024: 200, 2026: 240
      } },
    { id: 'visa', ticker: 'VISA', realTicker: 'V', name: 'Visa Inc.',
      competitorId: null, category: 'finance', country: 'Amerika Serikat',
      listedFrom: 2008, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2008: 45, 2010: 60, 2013: 65, 2015: 80, 2018: 140,
          2020: 200, 2022: 200, 2024: 270, 2026: 320
      } },
    { id: 'mastercard', ticker: 'MSTC', realTicker: 'MA', name: 'Mastercard Inc.',
      competitorId: null, category: 'finance', country: 'Amerika Serikat',
      listedFrom: 2006, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          2006: 50, 2008: 25, 2010: 50, 2013: 60, 2015: 100,
          2018: 200, 2020: 350, 2022: 330, 2024: 480, 2026: 560
      } },

    // ---- Energi & tambang (v2027.4b) ----
    { id: 'exxon', ticker: 'XOMM', realTicker: 'XOM', name: 'Exxon Mobil',
      competitorId: null, category: 'energy', country: 'Amerika Serikat',
      listedFrom: 1999, listedTo: null, currency: 'USD', confidence: 'trend',
      priceByYear: {
          1999: 40, 2000: 40, 2002: 30, 2005: 60, 2008: 70,
          2010: 70, 2013: 90, 2015: 80, 2018: 80, 2020: 40,
          2022: 100, 2024: 110, 2026: 105
      } },

    // ---- Indonesia / IDX (v2027.4b) ----
    { id: 'bbca', ticker: 'BBCA', realTicker: 'BBCA.JK', name: 'Bank Central Asia',
      competitorId: null, category: 'finance', country: 'Indonesia',
      listedFrom: 2000, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2000: 250, 2003: 380, 2007: 500, 2008: 330, 2010: 800,
          2013: 1600, 2015: 1800, 2017: 1900, 2019: 2300, 2020: 3100,
          2022: 4800, 2024: 9800, 2026: 10500
      } },
    { id: 'bbri', ticker: 'BBRI', realTicker: 'BBRI.JK', name: 'Bank Rakyat Indonesia',
      competitorId: null, category: 'finance', country: 'Indonesia',
      listedFrom: 2003, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2003: 500, 2008: 1200, 2010: 2500, 2013: 8000, 2015: 6000,
          2017: 3700, 2019: 4000, 2020: 3700, 2021: 4300, 2022: 4800,
          2023: 5500, 2024: 4800, 2026: 5200
      } },
    { id: 'bmri', ticker: 'BMRI', realTicker: 'BMRI.JK', name: 'Bank Mandiri',
      competitorId: null, category: 'finance', country: 'Indonesia',
      listedFrom: 2003, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2003: 400, 2008: 1500, 2010: 2400, 2013: 8000, 2015: 5000,
          2017: 6000, 2019: 6600, 2020: 5700, 2021: 6300, 2022: 9000,
          2023: 10000, 2024: 6400, 2026: 6800
      } },
    { id: 'telkom', ticker: 'TLKM', realTicker: 'TLKM.JK', name: 'Telkom Indonesia',
      competitorId: null, category: 'telecom', country: 'Indonesia',
      listedFrom: 1999, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          1999: 1500, 2003: 900, 2008: 3000, 2010: 3300, 2013: 3300,
          2016: 3500, 2018: 3800, 2019: 3500, 2020: 3300, 2021: 3400,
          2022: 4100, 2023: 3600, 2024: 2600, 2026: 2700
      } },
    { id: 'astra', ticker: 'ASII', realTicker: 'ASII.JK', name: 'Astra International',
      competitorId: null, category: 'consumer', country: 'Indonesia',
      listedFrom: 1999, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          1999: 500, 2003: 1700, 2008: 4000, 2010: 6000, 2013: 7500,
          2015: 6000, 2017: 7500, 2019: 6300, 2020: 5000, 2021: 6500,
          2022: 6300, 2023: 5000, 2024: 5000, 2026: 5300
      } },
    { id: 'unilever_id', ticker: 'UNVR', realTicker: 'UNVR.JK', name: 'Unilever Indonesia',
      competitorId: null, category: 'consumer', country: 'Indonesia',
      listedFrom: 1999, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          1999: 800, 2003: 1200, 2008: 1500, 2010: 2000, 2013: 3700,
          2015: 4200, 2017: 4500, 2019: 3200, 2020: 3800, 2021: 3700,
          2022: 3900, 2023: 2900, 2024: 2200, 2026: 2400
      } },
    { id: 'icbp', ticker: 'ICBP', realTicker: 'ICBP.JK', name: 'Indofood CBP Sukses Makmur',
      competitorId: null, category: 'consumer', country: 'Indonesia',
      listedFrom: 2010, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2010: 2000, 2013: 7000, 2015: 8000, 2017: 10000, 2019: 11000,
          2020: 10000, 2021: 10500, 2022: 10700, 2023: 10000, 2024: 10500, 2026: 10000
      } },
    { id: 'antam', ticker: 'ANTM', realTicker: 'ANTM.JK', name: 'Aneka Tambang',
      competitorId: null, category: 'energy', country: 'Indonesia',
      listedFrom: 1999, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          1999: 1200, 2003: 800, 2008: 4000, 2011: 2800, 2013: 900,
          2016: 700, 2018: 1600, 2020: 2000, 2021: 2500, 2022: 2200,
          2024: 1600, 2026: 1600
      } },
    { id: 'adaro', ticker: 'ADRO', realTicker: 'ADRO.JK', name: 'Adaro Energy Indonesia',
      competitorId: null, category: 'energy', country: 'Indonesia',
      listedFrom: 2008, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2008: 1200, 2010: 2000, 2012: 1100, 2014: 800, 2016: 800,
          2017: 1400, 2018: 1700, 2020: 800, 2021: 2500, 2022: 3700,
          2023: 2800, 2024: 2500, 2026: 2400
      } },
    { id: 'pgas', ticker: 'PGAS', realTicker: 'PGAS.JK', name: 'Perusahaan Gas Negara',
      competitorId: null, category: 'energy', country: 'Indonesia',
      listedFrom: 2003, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2003: 500, 2008: 2200, 2010: 2500, 2013: 2500, 2016: 2000,
          2018: 1800, 2020: 1100, 2022: 1600, 2024: 1400, 2026: 1500
      } },
    { id: 'merdeka', ticker: 'MDKA', realTicker: 'MDKA.JK', name: 'Merdeka Copper Gold',
      competitorId: null, category: 'energy', country: 'Indonesia',
      listedFrom: 2012, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: {
          2012: 3000, 2014: 2500, 2018: 2500, 2020: 2500,
          2021: 3500, 2022: 3000, 2024: 2500, 2026: 2600
      } },
    { id: 'goto', ticker: 'GOTO', realTicker: 'GOTO.JK', name: 'GoTo Gojek Tokopedia',
      competitorId: null, category: 'ecommerce', country: 'Indonesia',
      listedFrom: 2022, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: { 2022: 300, 2023: 60, 2024: 70, 2026: 60 } },
    { id: 'bukalapak', ticker: 'BUKA', realTicker: 'BUKA.JK', name: 'Bukalapak.com',
      competitorId: null, category: 'ecommerce', country: 'Indonesia',
      listedFrom: 2021, listedTo: null, currency: 'IDR', confidence: 'trend',
      priceByYear: { 2021: 300, 2022: 150, 2023: 130, 2024: 170, 2026: 180 } },
];

export const MARKET_INDICES = [
    { id: 'nasdaq', ticker: 'NDXQ', realTicker: 'IXIC', name: 'NASDAQ Composite',
      region: 'US',
      valueByYear: {
          1999: 4069.31, 2000: 2470.52, 2001: 1950.40, 2002: 1335.51,
          2003: 2003.37, 2004: 2175.44, 2005: 2205.32, 2006: 2415.29,
          2007: 2652.28, 2008: 1577.03, 2009: 2269.15, 2010: 2652.87,
          2011: 2605.15, 2012: 3019.51, 2013: 4176.59, 2014: 4736.05,
          2015: 5007.41, 2016: 5383.12, 2017: 6903.39, 2018: 6635.28,
          2019: 8972.60, 2020: 12888.28, 2021: 15644.97, 2022: 10466.48,
          2023: 15011.35, 2024: 19555.00, 2026: 23000.00
      } },
    { id: 'dow', ticker: 'DOWJ', realTicker: 'DJI', name: 'Dow Jones Industrial',
      region: 'US',
      valueByYear: {
          1999: 11497.12, 2000: 10786.85, 2001: 10021.50, 2002: 8341.63,
          2003: 10453.92, 2004: 10783.01, 2005: 10717.50, 2006: 12463.15,
          2007: 13264.82, 2008: 8776.39, 2009: 10428.05, 2010: 11577.51,
          2011: 12217.56, 2012: 13104.14, 2013: 16576.66, 2014: 17823.07,
          2015: 17425.03, 2016: 19762.60, 2017: 24719.22, 2018: 23327.46,
          2019: 28538.44, 2020: 30606.48, 2021: 36338.30, 2022: 33147.25,
          2023: 37689.54, 2024: 42544.22, 2026: 48000.00
      } },
    { id: 'sp500', ticker: 'SPXE', realTicker: 'GSPC', name: 'S&P 500',
      region: 'US',
      valueByYear: {
          1999: 1469.25, 2000: 1320.28, 2001: 1148.08, 2002: 879.82,
          2003: 1111.92, 2004: 1211.92, 2005: 1248.29, 2006: 1418.30,
          2007: 1468.36, 2008: 903.25, 2009: 1115.10, 2010: 1257.64,
          2011: 1257.60, 2012: 1426.19, 2013: 1848.36, 2014: 2058.90,
          2015: 2043.94, 2016: 2238.83, 2017: 2673.61, 2018: 2506.85,
          2019: 3230.78, 2020: 3756.07, 2021: 4766.18, 2022: 3839.50,
          2023: 4769.83, 2024: 5881.63, 2026: 6600.00
      } },
    // ---- Indeks dunia tambahan (v2027.4b) — nilai tahunan perkiraan [trend] ----
    { id: 'ihsg', ticker: 'IHSG', realTicker: 'JKSE', name: 'IDX Composite (IHSG)',
      region: 'ID',
      valueByYear: {
          1999: 398.04, 2000: 416.32, 2003: 691.90, 2005: 1162.64,
          2007: 2745.83, 2008: 1355.41, 2009: 2534.36, 2010: 3703.51,
          2012: 4316.69, 2013: 4274.18, 2015: 4593.01, 2016: 5296.71,
          2017: 6355.65, 2018: 6194.50, 2019: 6299.54, 2020: 5979.07,
          2021: 6581.48, 2022: 6850.62, 2023: 7272.80, 2024: 7079.00, 2026: 7800.00
      } },
    { id: 'nikkei', ticker: 'NIKK', realTicker: 'N225', name: 'Nikkei 225',
      region: 'JP',
      valueByYear: {
          1999: 18934, 2000: 13785, 2001: 10542, 2002: 8579, 2003: 10676,
          2005: 16111, 2007: 15308, 2008: 8860, 2009: 10546, 2010: 10229,
          2011: 8455, 2012: 10395, 2013: 16291, 2014: 17451, 2015: 19034,
          2016: 19114, 2017: 22765, 2018: 20015, 2019: 23657, 2020: 27444,
          2021: 28792, 2022: 26095, 2023: 33464, 2024: 39895, 2026: 48000
      } },
    { id: 'ftse', ticker: 'FTSE', realTicker: 'FTSE', name: 'FTSE 100',
      region: 'UK',
      valueByYear: {
          1999: 6930, 2001: 5217, 2002: 4344, 2003: 4477, 2005: 5619,
          2007: 6457, 2008: 4434, 2009: 5413, 2010: 5900, 2011: 5572,
          2013: 6731, 2014: 6566, 2015: 6242, 2016: 7143, 2017: 7688,
          2018: 6728, 2019: 7542, 2020: 6461, 2021: 7385, 2022: 7452,
          2023: 7733, 2024: 8173, 2026: 8800
      } },
    { id: 'dax', ticker: 'DAXX', realTicker: 'GDAXI', name: 'DAX',
      region: 'DE',
      valueByYear: {
          1999: 6958, 2000: 6434, 2001: 5160, 2002: 2893, 2003: 3965,
          2004: 4256, 2005: 5408, 2006: 6597, 2007: 8067, 2008: 4810,
          2009: 5957, 2010: 6914, 2011: 5898, 2012: 7612, 2013: 9552,
          2014: 9806, 2015: 10743, 2016: 11481, 2017: 12918, 2018: 10558,
          2019: 13249, 2020: 13719, 2021: 15885, 2022: 13924, 2023: 16752,
          2024: 19909, 2026: 23000
      } },
    { id: 'hangseng', ticker: 'HSIX', realTicker: 'HSI', name: 'Hang Seng',
      region: 'HK',
      valueByYear: {
          1999: 15154, 2000: 16170, 2001: 11397, 2002: 9321, 2003: 12576,
          2004: 14230, 2005: 14876, 2006: 19965, 2007: 27813, 2008: 14387,
          2009: 21873, 2010: 23035, 2011: 18434, 2012: 22657, 2013: 23051,
          2014: 24872, 2015: 21915, 2016: 22001, 2017: 29919, 2018: 25846,
          2019: 28190, 2020: 27231, 2021: 23398, 2022: 15460, 2023: 17047,
          2024: 20060, 2026: 22000
      } },
    { id: 'kospi', ticker: 'KOSP', realTicker: 'KS11', name: 'KOSPI',
      region: 'KR',
      valueByYear: {
          1999: 1028, 2000: 505, 2001: 470, 2002: 628, 2003: 811,
          2004: 936, 2005: 1359, 2006: 1435, 2007: 1897, 2008: 1125,
          2009: 1683, 2010: 2051, 2011: 1826, 2012: 1997, 2013: 2011,
          2014: 1916, 2015: 1961, 2016: 2027, 2017: 2468, 2018: 2041,
          2019: 2198, 2020: 2874, 2021: 2978, 2022: 2236, 2023: 2655,
          2024: 2400, 2026: 2700
      } },
];

export const STOCK_CATEGORIES = [
    { id: 'phone',     label: 'Ponsel' },
    { id: 'chip',      label: 'Chip' },
    { id: 'software',  label: 'Software' },
    { id: 'social',    label: 'Media Sosial' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'other',     label: 'Lainnya' },
    { id: 'finance',   label: 'Keuangan' },
    { id: 'energy',    label: 'Energi & Tambang' },
    { id: 'consumer',  label: 'Konsumen' },
    { id: 'telecom',   label: 'Telekomunikasi' },
    { id: 'player',    label: 'Perusahaan Anda' }
];

// ============================================================
// MATA UANG — symbol, desimal, dan kurs historis IDR/USD.
// rateToUSDByYear: berapa USD untuk 1 unit mata uang lokal.
// ============================================================
export const CURRENCIES = {
    USD: { symbol: '$', decimals: 2 },
    KRW: { symbol: '₩', decimals: 0 },
    TWD: { symbol: 'NT$', decimals: 0 },
    HKD: { symbol: 'HK$', decimals: 2 },
    IDR: { symbol: 'Rp', decimals: 0 }
};

// Kurs rata-rata tahunan: IDR per 1 USD.
// Sumber: FRED (OECD), Bank Indonesia, World Bank.
export const IDR_PER_USD_BY_YEAR = {
    1999: 8500, 2000: 8400, 2001: 10200, 2002: 9300, 2003: 8600,
    2004: 9000, 2005: 9700, 2006: 9200, 2007: 9100, 2008: 9700,
    2009: 10400, 2010: 9100, 2011: 8800, 2012: 9400, 2013: 10500,
    2014: 11800, 2015: 13400, 2016: 13300, 2017: 13400, 2018: 14200,
    2019: 14100, 2020: 14100, 2021: 14300, 2022: 14800, 2023: 15200,
    2024: 15800, 2025: 16200, 2026: 16800
};

// Ambil kurs USD untuk 1 unit mata uang tertentu pada tahun tertentu.
export function getCurrencyRateToUSD(currency, year) {
    if (currency === 'USD') return 1;
    if (currency === 'IDR') {
        // Interpolasi linear dari tabel IDR historis.
        var years = Object.keys(IDR_PER_USD_BY_YEAR).map(Number).sort(function (a, b) { return a - b; });
        if (!years.length) return 1 / 15000;
        if (year <= years[0]) return 1 / IDR_PER_USD_BY_YEAR[years[0]];
        if (year >= years[years.length - 1]) return 1 / IDR_PER_USD_BY_YEAR[years[years.length - 1]];
        for (var i = 0; i < years.length - 1; i++) {
            var y1 = years[i], y2 = years[i + 1];
            if (year >= y1 && year <= y2) {
                var v1 = IDR_PER_USD_BY_YEAR[y1];
                var v2 = IDR_PER_USD_BY_YEAR[y2];
                var rate = v1 + (v2 - v1) * ((year - y1) / (y2 - y1));
                return 1 / rate;
            }
        }
        return 1 / IDR_PER_USD_BY_YEAR[years[years.length - 1]];
    }
    // Mata uang lain: pakai kurs tetap (untuk saat ini).
    if (currency === 'KRW') return 1 / 1300;
    if (currency === 'TWD') return 1 / 32;
    if (currency === 'HKD') return 1 / 7.8;
    return 1;
}

export function getStockById(id) { return STOCKS.find(s => s.id === id) || null; }
export function getIndexById(id) { return MARKET_INDICES.find(i => i.id === id) || null; }
export function getStocksForYear(year) {
    return STOCKS.filter(s => {
        if (s.isPlayer) return false;
        if (year < s.listedFrom) return false;
        if (s.listedTo !== null && year > s.listedTo) return false;
        return true;
    });
     }

// ============================================================
// TIER UKURAN EMITEN — menentukan seberapa liar harga bergerak
// tiap bulan (volatilitas) dan seberapa besar satu transaksi
// pemain menggerakkan harga (likuiditas). mega = paling stabil.
// ============================================================
export const STOCK_TIER = {
    // mega
    samsung: 'mega', apple: 'mega', microsoft: 'mega', google: 'mega',
    amazon: 'mega', nvidia: 'mega', tsmc: 'mega', meta: 'mega',
    tencent: 'mega', jpmorgan: 'mega', visa: 'mega', mastercard: 'mega',
    exxon: 'mega', bbca: 'mega', bbri: 'mega', bmri: 'mega', telkom: 'mega',
    foxconn: 'mega', cisco: 'mega', booking: 'mega',
    // large
    xiaomi: 'large', intel: 'large', qualcomm: 'large', asml: 'large',
    broadcom: 'large', oracle: 'large', adobe: 'large', alibaba: 'large',
    netflix: 'large', tesla: 'large', sony: 'large', ibm: 'large',
    spotify: 'large', baidu: 'large', lenovo: 'large', lg: 'large',
    dell: 'large', hp: 'large', ti: 'large', micron: 'large', adi: 'large',
    st: 'large', sap: 'large', salesforce: 'large', intuit: 'large',
    uber: 'large', airbnb: 'large', paypal: 'large', jdcom: 'large',
    pdd: 'large', mercadolibre: 'large', astra: 'large', unilever_id: 'large',
    icbp: 'large', adaro: 'large',
    // mid
    nokia: 'mid', motorola: 'mid', erajaya: 'mid', amd: 'mid', arm: 'mid',
    twitter: 'mid', ebay: 'mid', shopify: 'mid', asus: 'mid', logitech: 'mid',
    wdc: 'mid', sandisk: 'mid', sea: 'mid', zoom: 'mid', pinterest: 'mid',
    block: 'mid', coupang: 'mid', antam: 'mid', pgas: 'mid',
    // small
    blackberry: 'small', htc: 'small', polytron: 'small', snap: 'small',
    yahoo: 'small', reddit: 'small', merdeka: 'small', goto: 'small',
    bukalapak: 'small'
};

export function getStockTier(stockId) {
    return STOCK_TIER[stockId] || 'large';
}
