# Pay One Rupee

A landing page for a voluntary ₹1 curiosity experiment. It starts the visible count at 1,000 and reveals it only after server-side payment verification.

## Deploy on Vercel

This project can be deployed on Vercel. Configure these encrypted environment variables in **Project Settings → Environment Variables**:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Your final HTTPS domain, for example `https://payone.example` |
| `RAZORPAY_KEY_ID` | Razorpay live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay live key secret — never expose this in browser code |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

Create an **Upstash Redis** database through the Vercel Marketplace and copy its REST URL and token into those two variables. The payment functions use Redis atomically: each confirmed Razorpay payment gets a fixed position and increments the global count once. Vercel Functions have a read-only deployment filesystem, so a local JSON counter would not work in production. Use separate Redis databases for Preview and Production so test payments do not affect the public count. Use Razorpay Test Mode credentials for Preview; put live credentials only in Production.

For Production, set `PUBLIC_SITE_URL` to the final public HTTPS domain and allowlist it as a Razorpay callback URL. For Preview, leave `PUBLIC_SITE_URL` unset so Vercel's deployment URL is used, and ensure it can be used as a Razorpay Test Mode callback. The serverless functions create a unique Razorpay Payment Link for each visitor, use its `callback_url`, then fetch that link from Razorpay and only reveal the count when its status is `paid`. Payment Link amounts are specified in paise, so `100` is ₹1. The browser only redirects to Razorpay's HTTPS checkout domain; if checkout creation fails, it shows an error and allows a retry instead of using an unverified payment address.

For local visual-only development, open `index.html` or run `python3 -m http.server`. A static preview cannot accept or verify payments; the Vercel `/api` functions and configured credentials are required for checkout.

## Before going live

- Add the operator’s legal entity or individual name, support email, physical/business address where applicable, privacy policy, terms, and a clear cancellation/refund position.
- Complete Razorpay account verification and confirm Razorpay permits this use case on your account. Test the complete flow in Razorpay Test Mode, including successful, cancelled, and failed payments, before switching Production to live credentials. Have a qualified India lawyer review the business model and disclosures. This repository is not legal advice and cannot guarantee legal compliance.
- Keep the legacy `server.js` only for local single-server experiments; Vercel deployments use the `/api` functions and Redis instead.
