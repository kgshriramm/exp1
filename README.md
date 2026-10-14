# Pay One Rupee

A landing page for a voluntary ₹1 curiosity experiment. It starts the visible count at 1,000 and reveals it only after server-side payment verification.

## Deploy on Vercel

This project is ready to import from GitHub in Vercel. Before deployment, add these encrypted Production environment variables in **Project Settings → Environment Variables**:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Your final HTTPS domain, for example `https://payone.example` |
| `RAZORPAY_KEY_ID` | Razorpay live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay live key secret — never expose this in browser code |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

Create an **Upstash Redis** database through the Vercel Marketplace and copy its REST URL and token into those two variables. The payment functions use Redis atomically: each confirmed Razorpay payment gets a fixed position and increments the global count once. Vercel Functions have a read-only deployment filesystem, so a local JSON counter would not work in production.

The `PUBLIC_SITE_URL` must be a public HTTPS URL and should be allowlisted as a Razorpay callback URL. The serverless functions create a unique Razorpay Payment Link for each visitor, use its `callback_url`, then fetch that link from Razorpay and only reveal the count when its status is `paid`. Payment Link amounts are specified in paise, so `100` is ₹1.

For local visual-only development, open `index.html` or run `python3 -m http.server`. The supplied `upi://` URI will open a mobile UPI app, but it cannot return verified payment status to a static site; Vercel’s `/api` functions handle the verified production flow.

## Before going live

- Replace “StyleSync”/the supplied UPI fallback with the legal merchant name that users will see in Razorpay.
- Add the operator’s legal entity or individual name, support email, physical/business address where applicable, privacy policy, terms, and a clear cancellation/refund position.
- Complete Razorpay account verification and have a qualified India lawyer review the business model and disclosures. This repository is not legal advice and cannot guarantee legal compliance.
- Keep the legacy `server.js` only for local single-server experiments; Vercel deployments use the `/api` functions and Redis instead.
