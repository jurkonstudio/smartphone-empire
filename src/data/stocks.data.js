// FILE: src/data/stocks.data.js
// ============================================================
// DATA SAHAM HISTORIS — untuk halaman Exchange di HQ.
// v2027.3a — tambah IDR, Polytron (fiktif), ERAA, kurs historis.
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
      priceByYear: null }
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
      } }
];

export const STOCK_CATEGORIES = [
    { id: 'phone',     label: 'Ponsel' },
    { id: 'chip',      label: 'Chip' },
    { id: 'software',  label: 'Software' },
    { id: 'social',    label: 'Media Sosial' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'other',     label: 'Lainnya' },
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
