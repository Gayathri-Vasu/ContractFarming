const express = require('express');
const DigiContract = require('../models/DigiContract');
const Contract = require('../models/Contract');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Utility to upsert DigiContract from a Contract (aligned with DigiContract schema)
async function ensureDigiContractFor(contract) {
  const existing = await DigiContract.findOne({ contract: contract._id });
  if (existing) return existing;
  let cropName = contract.cropName;
  if (!cropName && contract.crop) {
    try {
      const c = await Contract.findById(contract._id).populate('crop').lean();
      cropName = c?.crop?.name || '';
    } catch {
      cropName = '';
    }
  }
  const contractId =
    contract.contractId ||
    `DC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalAmount =
    typeof contract.totalAmount === 'number'
      ? contract.totalAmount
      : (Number(contract.quantity) || 0) * (Number(contract.pricePerUnit) || 0);
  const doc = await DigiContract.create({
    contract: contract._id,
    contractId,
    farmer: contract.farmer,
    buyer: contract.buyer,
    crop: cropName || '',
    quantity: contract.quantity,
    pricePerUnit: contract.pricePerUnit,
    totalAmount,
    deliveryDate: contract.deliveryDate,
    paymentStatus: 'Pending',
    status: 'Pending'
  });
  try {
    await generatePdfForDigi(doc);
  } catch {}
  return doc;
}

function buildCertificateHTML(doc) {
  const total =
    typeof doc.totalAmount === 'number'
      ? doc.totalAmount
      : (Number(doc.quantity) || 0) * (Number(doc.pricePerUnit) || 0);
  const delivery = doc.deliveryDate ? new Date(doc.deliveryDate).toDateString() : '—';
  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
  body{margin:0;background:#e6f4ea;font-family:Arial,Helvetica,sans-serif}
  .outer{padding:32px}
  .card{background:#fff;border:12px solid #0f6b3b;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:32px}
  h1{color:#0f6b3b;text-align:center;margin:0}
  .sub{color:#4d7c5b;text-align:center;margin:8px 0 24px}
  .row{display:flex;gap:16px;margin-top:16px}
  .col{flex:1;background:#f3faf5;border-radius:8px;padding:16px}
  .sec h3{margin:0 0 8px 0;color:#0f6b3b}
  .kv{margin:4px 0}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;background:#eef2f5;margin-left:8px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ft{display:flex;justify-content:space-between;margin-top:24px;color:#0f6b3b;font-style:italic}
  </style></head><body>
  <div class="outer"><div class="card">
  <h1>ASSURED CONTRACT FARMING AGREEMENT</h1>
  <div class="sub">Secure Contracts • Stable Income • Assured Growth</div>
  <div style="text-align:center;margin-bottom:12px">
    <span>DC ID: ${doc.digiContractId || doc._id}</span>
    <span class="badge">${doc.status}</span>
  </div>
  <div class="row">
    <div class="col sec">
      <h3>Farmer Details</h3>
      <div class="kv"><strong>Farmer ID:</strong> ${doc.farmer || '—'}</div>
    </div>
    <div class="col sec">
      <h3>Buyer Details</h3>
      <div class="kv"><strong>Buyer ID:</strong> ${doc.buyer || '—'}</div>
    </div>
  </div>
  <div class="row">
    <div class="col sec" style="flex:2">
      <h3>Agreement Terms</h3>
      <div class="grid2">
        <div class="kv"><strong>Crop:</strong> ${doc.crop || '—'}</div>
        <div class="kv"><strong>Quantity:</strong> ${doc.quantity || 0}</div>
        <div class="kv"><strong>Price / Unit:</strong> ₹${doc.pricePerUnit || 0}</div>
        <div class="kv"><strong>Total:</strong> ₹${total.toLocaleString()}</div>
        <div class="kv"><strong>Delivery Date:</strong> ${delivery}</div>
      </div>
      <div class="kv" style="margin-top:8px"><strong>Document Created:</strong> ${doc.createdDate} ${doc.createdTime} (${doc.timezone})</div>
    </div>
    <div class="col sec">
      <h3>Payment Status</h3>
      <div class="kv">${doc.paymentStatus || 'Pending'}</div>
      <div class="kv"><strong>Payer:</strong> Buyer</div>
      <div class="kv"><strong>Receiver:</strong> Farmer</div>
    </div>
  </div>
  <div class="ft">
    <div>Farmer: ${doc.signatures?.farmerSigned ? 'Signed' : 'Pending'} ${doc.signatures?.farmerSignedDate ? '('+new Date(doc.signatures.farmerSignedDate).toDateString()+')' : ''}</div>
    <div>Buyer: ${doc.signatures?.buyerSigned ? 'Signed' : 'Pending'} ${doc.signatures?.buyerSignedDate ? '('+new Date(doc.signatures.buyerSignedDate).toDateString()+')' : ''}</div>
  </div>
  </div></div></body></html>`;
}

async function generatePdfForDigi(doc) {
  const outDir = path.join(__dirname, '..', 'uploads', 'digi-contracts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filename = `DigiContract-${doc.digiContractId || doc._id}.pdf`;
  const outPath = path.join(outDir, filename);
  try {
    const puppeteer = require('puppeteer');
    const html = buildCertificateHTML(doc);
    const browser = await puppeteer.launch({ headless: 'new' });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({ path: outPath, format: 'A4', printBackground: true });
      doc.pdfPath = outPath;
      await doc.save();
      return outPath;
    } finally {
      await browser.close();
    }
  } catch {
    // Fallback to PDFKit if Puppeteer is not available
    const pdf = new PDFDocument({ size: 'A4', margin: 50 });
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(outPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      pdf.pipe(stream);
      pdf.fontSize(20).fillColor('#0f6b3b').text('ASSURED CONTRACT FARMING AGREEMENT', { align: 'center' });
      pdf.moveDown(0.5);
      pdf.fontSize(12).fillColor('#4d7c5b').text('Secure Contracts • Stable Income • Assured Growth', { align: 'center' });
      pdf.moveDown(1);
      pdf.fillColor('#000').fontSize(12);
      pdf.text(`DigiContract ID: ${doc.digiContractId || doc._id}`);
      pdf.text(`Status: ${doc.status || 'Pending'}`);
      pdf.moveDown(1);
      pdf.fontSize(14).fillColor('#0f6b3b').text('Farmer Details');
      pdf.fillColor('#000').fontSize(12);
      pdf.text(`ID: ${doc.farmer?.toString() || '—'}`);
      pdf.text(`Name: ${doc.farmer?.name || '—'}`);
      pdf.moveDown(0.5);
      pdf.fontSize(14).fillColor('#0f6b3b').text('Buyer Details');
      pdf.fillColor('#000').fontSize(12);
      pdf.text(`ID: ${doc.buyer?.toString() || '—'}`);
      pdf.text(`Name: ${doc.buyer?.name || '—'}`);
      pdf.moveDown(0.5);
      pdf.fontSize(14).fillColor('#0f6b3b').text('Agreement Terms');
      pdf.fillColor('#000').fontSize(12);
      const total =
        typeof doc.totalAmount === 'number'
          ? doc.totalAmount
          : (Number(doc.quantity) || 0) * (Number(doc.pricePerUnit) || 0);
      const delivery = doc.deliveryDate ? new Date(doc.deliveryDate).toDateString() : '—';
      pdf.text(`Crop: ${doc.crop || '—'}`);
      pdf.text(`Quantity: ${doc.quantity ?? 0}`);
      pdf.text(`Price / Unit: ₹${doc.pricePerUnit ?? 0}`);
      pdf.text(`Total Amount: ₹${total.toLocaleString('en-IN')}`);
      pdf.text(`Delivery Date: ${delivery}`);
      pdf.moveDown(0.5);
      pdf.fontSize(14).fillColor('#0f6b3b').text('Payment Status');
      pdf.fillColor('#000').fontSize(12);
      pdf.text(`${doc.paymentStatus || 'Pending'}`);
      pdf.text(`Payer: Buyer`);
      pdf.text(`Receiver: Farmer`);
      pdf.end();
    });
    doc.pdfPath = outPath;
    await doc.save();
    return outPath;
  }
}

// GET /api/digicontracts/user/:userId
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    // Proactively generate missing digicontracts for all non-rejected contracts belonging to user
    const eligibleContracts = await Contract.find({
      $or: [{ farmer: userId }, { buyer: userId }],
      status: { $nin: ['rejected', 'Rejected', 'cancelled', 'Cancelled'] }
    }).lean();
    for (const c of eligibleContracts) {
      // best-effort ensure
      // eslint-disable-next-line no-await-in-loop
      await ensureDigiContractFor(c);
    }

    let docs = await DigiContract.find({
      $or: [{ farmer: userId }, { buyer: userId }]
    }).sort({ createdAt: -1 });
    // Ensure PDFs exist (best-effort)
    for (const d of docs) {
      if (!d.pdfPath) {
        try {
          await generatePdfForDigi(d);
        } catch {}
      }
    }
    // Re-read to include pdfPath updates (optional)
    docs = await DigiContract.find({
      $or: [{ farmer: userId }, { buyer: userId }]
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/digicontracts/:id/pdf
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const doc = await DigiContract.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'DigiContract not found' });
    }
    const filePath = doc.pdfPath;
    if (filePath && fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      fs.createReadStream(filePath).pipe(res);
    } else {
      const p = await generatePdfForDigi(doc);
      if (p && fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(p)}"`);
        fs.createReadStream(p).pipe(res);
      } else {
        return res.status(404).json({ success: false, message: 'PDF not available' });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/digicontracts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await DigiContract.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'DigiContract not found' });
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/digicontracts/sign/:id
router.post('/sign/:id', protect, async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const doc = await DigiContract.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'DigiContract not found' });
    }
    const now = new Date();
    if (role === 'farmer') {
      doc.signatures.farmerSigned = true;
      doc.signatures.farmerSignedDate = now;
    } else {
      doc.signatures.buyerSigned = true;
      doc.signatures.buyerSignedDate = now;
    }
    if (doc.signatures.farmerSigned && doc.signatures.buyerSigned) {
      doc.status = 'Active';
    } else if (doc.signatures.farmerSigned || doc.signatures.buyerSigned) {
      doc.status = 'Partially Signed';
    } else {
      doc.status = 'Pending Signature';
    }
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Alias: PUT /api/digicontract/sign/:id
router.put('/sign/:id', protect, async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['farmer', 'buyer'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only farmer or buyer can sign' });
    }
    const doc = await DigiContract.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'DigiContract not found' });
    }
    const now = new Date();
    if (userRole === 'farmer') {
      doc.signatures.farmerSigned = true;
      doc.signatures.farmerSignedDate = now;
    } else {
      doc.signatures.buyerSigned = true;
      doc.signatures.buyerSignedDate = now;
    }
    if (doc.signatures.farmerSigned && doc.signatures.buyerSigned) {
      doc.status = 'Active';
    } else if (doc.signatures.farmerSigned || doc.signatures.buyerSigned) {
      doc.status = 'Partially Signed';
    } else {
      doc.status = 'Pending Signature';
    }
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
