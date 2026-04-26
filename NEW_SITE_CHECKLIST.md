# New Site Checklist

Use this repository as the base for each new store.

## 1. Create The New Copy

Clone or copy the base project into a new folder/repo.

Recommended repo naming:

```text
StoreLite-client-name
```

## 2. Configure The Store

Copy:

```bash
.env.site.example -> .env
```

Update:

```env
STORE_NAME=
STORE_TAGLINE=
STORE_DESCRIPTION=
SUPPORT_EMAIL=
THEME_COLOR=
ACCENT_COLOR=
CURRENCY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
SESSION_SECRET=
```

For Railway with a persistent volume mounted at `/data`, use:

```env
DATABASE_PATH=/data/store.db
UPLOADS_PATH=/data/uploads
```

## 3. Add Products

Start locally:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000/admin
```

Add categories, products, prices, stock, images, and optional affiliate URLs.

## 4. Deploy

Push the new store repo to GitHub, then deploy it from Railway.

Set the same `.env` values in Railway variables. Do not upload `.env` to GitHub.

## 5. Stripe

For checkout, set:

```env
STRIPE_SECRET_KEY=
SUCCESS_URL=https://your-domain.com/success
CANCEL_URL=https://your-domain.com/cart
```

For larger stores, add a Stripe webhook before taking real payments.
