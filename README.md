# StoreLite

A reusable Shopify-lite starter you can clone for different stores and host on Railway.

## Features
- Customer storefront
- Product search, categories, and product detail pages
- Admin login
- Add/edit/delete products
- Upload product images
- SQLite database
- Cart using browser localStorage with server-side product pricing validation
- Stripe Checkout support
- Amazon/affiliate URL support per product
- Pending/paid order records in admin
- Stock checks during checkout
- Per-site branding through environment variables

## Reusing For Different Sites

For each new store, copy this project into a new folder or repository and start from:

```bash
.env.site.example
```

Main per-site settings:

```env
STORE_NAME=
STORE_TAGLINE=
STORE_DESCRIPTION=
SUPPORT_EMAIL=
LOGO_URL=
HERO_IMAGE_URL=
THEME_COLOR=
ACCENT_COLOR=
CURRENCY=
```

See `NEW_SITE_CHECKLIST.md` for the full new-site flow.

## Local Setup
```bash
npm install
cp .env.example .env
npm start
```
Open: http://localhost:3000

Default admin comes from `.env`:
- ADMIN_EMAIL
- ADMIN_PASSWORD

## Railway Setup
1. Upload/push this folder to GitHub.
2. Create a Railway project from the GitHub repo.
3. Add a persistent volume if you want SQLite/image uploads to survive redeploys.
4. Set variables:
   - SESSION_SECRET
   - ADMIN_EMAIL
   - ADMIN_PASSWORD
   - STORE_NAME
   - STORE_TAGLINE
   - STORE_DESCRIPTION
   - SUPPORT_EMAIL
   - THEME_COLOR
   - ACCENT_COLOR
   - CURRENCY
   - DATABASE_PATH=/data/store.db if using Railway volume mounted at /data
   - UPLOADS_PATH=/data/uploads if using Railway volume mounted at /data
   - STRIPE_SECRET_KEY optional
   - SUCCESS_URL=https://your-domain.com/success
   - CANCEL_URL=https://your-domain.com/cart

## Important
For production, use a strong admin password and session secret.

The app records orders and marks them paid on the success redirect. For higher-value stores, add a Stripe webhook so payment confirmation and inventory updates are based on Stripe events instead of the customer's browser returning to `/success`.
