const axios = require('axios');
const MarketPrice = require('../models/MarketPrice');

const GOVT_API_URL = 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';
const GOVT_API_KEY =
  process.env.DATA_GOV_API_KEY ||
  '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const PAGE_LIMIT = 10;
const MIN_RECORDS_TARGET = 500;
const REQUEST_DELAY_MS = 200;

const toNumber = (value) => {
  if (value == null) return 0;
  const normalized = String(value).replace(/,/g, '').trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
};

const quintalToKg = (value) => {
  const perKg = toNumber(value) / 100;
  return Number(perKg.toFixed(2));
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toDate = (value) => {
  if (!value) return new Date();
  const str = String(value).trim();

  // Handle common DD/MM/YYYY format from mandi datasets.
  const parts = str.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map((p) => Number(p));
    if (Number.isFinite(dd) && Number.isFinite(mm) && Number.isFinite(yyyy)) {
      return new Date(yyyy, mm - 1, dd);
    }
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const fetchAndStoreMarketPrices = async () => {
  const records = [];
  let offset = 0;

  while (records.length < MIN_RECORDS_TARGET) {
    const response = await axios.get(GOVT_API_URL, {
      params: {
        'api-key': GOVT_API_KEY,
        format: 'json',
        limit: PAGE_LIMIT,
        offset
      },
      timeout: 15000
    });

    const batch = Array.isArray(response?.data?.records) ? response.data.records : [];
    if (!batch.length) break;

    records.push(...batch);
    offset += PAGE_LIMIT;
    await delay(REQUEST_DELAY_MS);
  }

  if (!records.length) return [];

  const operations = records.map((record) => {
    const payload = {
      cropName: String(record.Commodity || '').trim(),
      market: String(record.Market || '').trim(),
      state: String(record.State || '').trim(),
      minPrice: quintalToKg(record.Min_Price),
      maxPrice: quintalToKg(record.Max_Price),
      modalPrice: quintalToKg(record.Modal_Price),
      date: toDate(record.Arrival_Date)
    };

    if (!payload.cropName || !payload.market) {
      return null;
    }

    return {
      updateOne: {
        filter: {
          cropName: payload.cropName,
          market: payload.market,
          date: payload.date
        },
        update: { $set: payload },
        upsert: true
      }
    };
  }).filter(Boolean);

  if (!operations.length) return [];

  await MarketPrice.bulkWrite(operations, { ordered: false });

  return operations;
};

module.exports = {
  fetchAndStoreMarketPrices
};
