const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MarketPrice = require('./models/MarketPrice');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const CSV_PATH = path.resolve(__dirname, 'data', 'market_prices.csv');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contract-farming';

const toPerKgRounded = (value) => {
  const num = Number(String(value || '0').replace(/,/g, '').trim());
  const perKg = Number.isFinite(num) ? num / 100 : 0;
  return Number(perKg.toFixed(2));
};

const parseDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  // Handle DD/MM/YYYY style dates.
  const parts = raw.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map((p) => Number(p));
    if (Number.isFinite(dd) && Number.isFinite(mm) && Number.isFinite(yyyy)) {
      return new Date(Date.UTC(yyyy, mm - 1, dd));
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const readCsvRows = () =>
  new Promise((resolve, reject) => {
    const rows = [];

    if (!fs.existsSync(CSV_PATH)) {
      reject(new Error(`CSV file not found at: ${CSV_PATH}`));
      return;
    }

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

const run = async () => {
  let insertedCount = 0;

  try {
    await mongoose.connect(MONGO_URI);

    const rows = await readCsvRows();
    const operations = [];

    for (const row of rows) {
      const cropName = String(row.Commodity || '').trim();
      const market = String(row.Market || '').trim();
      const state = String(row.State || '').trim();
      const date = parseDate(row.Arrival_Date);

      if (!cropName || !market || !date) continue;

      const payload = {
        cropName,
        market,
        state,
        minPrice: toPerKgRounded(row.Min_Price),
        maxPrice: toPerKgRounded(row.Max_Price),
        modalPrice: toPerKgRounded(row.Modal_Price),
        date
      };

      operations.push({
        updateOne: {
          filter: {
            cropName: payload.cropName,
            market: payload.market,
            date: payload.date
          },
          update: { $set: payload },
          upsert: true
        }
      });
    }

    if (operations.length > 0) {
      const result = await MarketPrice.bulkWrite(operations, { ordered: false });
      insertedCount = result.upsertedCount || 0;
    }

    console.log(`Total records inserted: ${insertedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
    } catch (_) {}
  }
};

run();
