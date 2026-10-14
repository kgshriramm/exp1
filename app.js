/*
  Payments use Razorpay-hosted links so the server can verify completion
  before the count is revealed. Never fall back to an unverified payment URI.
*/
const paymentDialog = document.querySelector('#payment-dialog');
const legalDialog = document.querySelector('#legal-dialog');
const resultDialog = document.querySelector('#result-dialog');
const checkoutButton = document.querySelector('#create-payment-link');
const checkoutStatus = document.querySelector('#checkout-status');

document.querySelectorAll('[data-open-payment]').forEach((button) => {
  button.addEventListener('click', () => paymentDialog.showModal());
});
document.querySelector('[data-open-legal]').addEventListener('click', () => legalDialog.showModal());
document.querySelector('[data-close-dialog]').addEventListener('click', () => paymentDialog.close());
document.querySelector('[data-close-legal]').addEventListener('click', () => legalDialog.close());
document.querySelector('[data-close-result]').addEventListener('click', () => resultDialog.close());

checkoutButton.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  checkoutStatus.hidden = false;
  checkoutStatus.textContent = 'Creating your secure checkout…';
  try {
    const response = await fetch('/api/create-payment-link', { method: 'POST' });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Secure checkout could not be started.');
    }
    const paymentUrl = new URL(result.paymentUrl);
    if (paymentUrl.protocol !== 'https:' || paymentUrl.hostname !== 'rzp.io') {
      throw new Error('The payment provider returned an invalid checkout URL.');
    }
    window.location.assign(paymentUrl.href);
  } catch (error) {
    checkoutStatus.textContent = error instanceof TypeError
      ? 'Secure checkout is unavailable. Please try again later.'
      : error.message;
    checkoutButton.disabled = false;
  }
});
