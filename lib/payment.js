const RAZORPAY_API = 'https://api.razorpay.com/v1';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function razorpay(path, options = {}) {
  const auth = Buffer.from(`${required('RAZORPAY_KEY_ID')}:${required('RAZORPAY_KEY_SECRET')}`).toString('base64');
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.description || 'Razorpay request failed.');
  return data;
}

async function redis(command) {
  const response = await fetch(required('UPSTASH_REDIS_REST_URL'), {
    method: 'POST',
    headers: { authorization: `Bearer ${required('UPSTASH_REDIS_REST_TOKEN')}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Counter storage request failed.');
  return data.result;
}

function siteUrl() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  throw new Error('PUBLIC_SITE_URL is not configured.');
}

function json(response, status, body) {
  response.status(status).setHeader('cache-control', 'no-store').json(body);
}

module.exports = { json, razorpay, redis, siteUrl };
