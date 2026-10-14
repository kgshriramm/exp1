/*
  PAYMENT SAFETY NOTE
  A UPI deeplink can open a payment app, but it cannot securely report payment
  success back to a static page. When server.js has Razorpay keys configured,
  this button creates a hosted Payment Link instead. Its success page checks
  the payment with Razorpay before it displays the count.
*/
const paymentDialog = document.querySelector('#payment-dialog');
const legalDialog = document.querySelector('#legal-dialog');
const resultDialog = document.querySelector('#result-dialog');
const upiLink = document.querySelector('#upi-link');

document.querySelectorAll('[data-open-payment]').forEach((button) => {
  button.addEventListener('click', () => paymentDialog.showModal());
});
document.querySelector('[data-open-legal]').addEventListener('click', () => legalDialog.showModal());
document.querySelector('[data-close-dialog]').addEventListener('click', () => paymentDialog.close());
document.querySelector('[data-close-legal]').addEventListener('click', () => legalDialog.close());
document.querySelector('[data-close-result]').addEventListener('click', () => resultDialog.close());

// Keep the original UPI URI intact (not URL-encoded) so installed UPI apps can parse it.
// Prefer the verified server flow; fall back to this supplied deeplink for a static preview.
upiLink.addEventListener('click', async (event) => {
  event.preventDefault();
  document.querySelector('#verification-note').hidden = false;
  try {
    const response = await fetch('/api/create-payment-link', { method: 'POST' });
    if (response.ok) {
      const { paymentUrl } = await response.json();
      window.location.assign(paymentUrl);
      return;
    }
  } catch (_) {
    // A static host has no API; the UPI URI below remains a usable mobile fallback.
  }
  window.location.assign(upiLink.href);
});
