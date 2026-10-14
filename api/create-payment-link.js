const crypto = require('node:crypto');
const { json, razorpay, siteUrl } = require('../lib/payment');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return json(response, 405, { message: 'Method not allowed.' });
  try {
    const referenceId = `payone-${crypto.randomUUID().replaceAll('-', '').slice(0, 25)}`;
    const link = await razorpay('/payment_links', {
      method: 'POST',
      body: JSON.stringify({
        amount: 100, currency: 'INR', accept_partial: false, reference_id: referenceId,
        description: '₹1 Pay One Rupee curiosity experiment',
        callback_url: `${siteUrl()}/payment-success.html`, callback_method: 'get',
        notes: { experiment: 'pay-one-rupee' },
      }),
    });
    return json(response, 201, { paymentUrl: link.short_url });
  } catch (error) {
    return json(response, 503, { message: error.message });
  }
};
