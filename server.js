/* Node 18+ reference server for the live Razorpay Payment Link flow.
   Keep RAZORPAY_KEY_SECRET server-side. This intentionally never trusts a
   browser “payment succeeded” claim: it fetches the Payment Link from Razorpay.
*/
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const port = Number(process.env.PORT || 4173);
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, '');
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const files = { '/': 'index.html', '/payment-success.html': 'payment-success.html', '/styles.css': 'styles.css', '/app.js': 'app.js' };
const dataDir = path.join(__dirname, 'data');
const countFile = path.join(dataDir, 'payments.json');

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
function paymentData() {
  try { return JSON.parse(fs.readFileSync(countFile, 'utf8')); }
  catch (_) { return { baseline: 1000, paymentIds: [] }; }
}
function savePaymentData(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(countFile, JSON.stringify(data, null, 2));
}
async function razorpay(endpoint, options = {}) {
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured on this server.');
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    ...options, headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.description || 'Razorpay request failed.');
  return body;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, appUrl);
  if (req.method === 'POST' && url.pathname === '/api/create-payment-link') {
    try {
      const referenceId = `payone-${crypto.randomUUID().replaceAll('-', '').slice(0, 25)}`;
      const link = await razorpay('/payment_links', { method: 'POST', body: JSON.stringify({
        amount: 100, currency: 'INR', accept_partial: false, reference_id: referenceId,
        description: '₹1 Pay One Rupee curiosity experiment', callback_url: `${appUrl}/payment-success.html`, callback_method: 'get',
        notes: { experiment: 'pay-one-rupee' }
      }) });
      return send(res, 201, { paymentUrl: link.short_url });
    } catch (error) { return send(res, 503, { message: error.message }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/verify-payment') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let paymentLinkId;
    try { paymentLinkId = JSON.parse(raw).paymentLinkId; } catch (_) { return send(res, 400, { verified: false, message: 'Invalid request.' }); }
    if (!/^plink_[A-Za-z0-9]+$/.test(paymentLinkId || '')) return send(res, 400, { verified: false, message: 'Invalid payment reference.' });
    try {
      const link = await razorpay(`/payment_links/${paymentLinkId}`);
      const payment = link.payments?.[0];
      if (link.status !== 'paid' || link.amount !== 100 || link.currency !== 'INR' || link.notes?.experiment !== 'pay-one-rupee' || !payment?.payment_id) {
        return send(res, 402, { verified: false, message: 'Payment has not been confirmed yet.' });
      }
      const data = paymentData();
      if (!data.paymentIds.includes(payment.payment_id)) {
        data.paymentIds.push(payment.payment_id);
        savePaymentData(data);
      }
      return send(res, 200, { verified: true, count: data.baseline + data.paymentIds.length - 1 });
    } catch (error) { return send(res, 503, { verified: false, message: error.message }); }
  }
  if (req.method === 'GET' && files[url.pathname]) {
    const filename = files[url.pathname];
    const contentType = filename.endsWith('.css') ? 'text/css' : filename.endsWith('.js') ? 'application/javascript' : 'text/html';
    return send(res, 200, fs.readFileSync(path.join(__dirname, filename)), contentType);
  }
  return send(res, 404, 'Not found', 'text/plain');
});
server.listen(port, () => console.log(`Pay One Rupee listening at ${appUrl}`));
