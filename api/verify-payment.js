const { json, razorpay, redis } = require('../lib/payment');

const recordPayment = `
  local previous = redis.call('GET', KEYS[1])
  if previous then return previous end
  if not redis.call('GET', KEYS[2]) then redis.call('SET', KEYS[2], ARGV[1]) end
  local position = redis.call('INCR', KEYS[2]) - 1
  redis.call('SET', KEYS[1], position)
  return position
`;

module.exports = async (request, response) => {
  if (request.method !== 'POST') return json(response, 405, { message: 'Method not allowed.' });
  const paymentLinkId = request.body?.paymentLinkId;
  if (!/^plink_[A-Za-z0-9]+$/.test(paymentLinkId || '')) {
    return json(response, 400, { verified: false, message: 'Invalid payment reference.' });
  }
  try {
    const link = await razorpay(`/payment_links/${paymentLinkId}`);
    const payment = link.payments?.[0];
    if (link.status !== 'paid' || link.amount !== 100 || link.currency !== 'INR' || link.notes?.experiment !== 'pay-one-rupee' || !payment?.payment_id) {
      return json(response, 402, { verified: false, message: 'Payment has not been confirmed yet.' });
    }
    const count = await redis(['EVAL', recordPayment, 2, `payone:payment:${payment.payment_id}`, 'payone:count', 1000]);
    return json(response, 200, { verified: true, count: Number(count) });
  } catch (error) {
    return json(response, 503, { verified: false, message: error.message });
  }
};
