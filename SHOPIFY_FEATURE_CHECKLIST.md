# Shopify Feature Checklist For StoreLite

Use this as the internal product map for turning StoreLite into a reusable Shopify-lite platform.

Status key:

```text
DONE = already exists in StoreLite
NEXT = good near-term feature
LATER = advanced feature
SHOPIFY = Shopify-level feature, likely out of scope for first version
```

## Current StoreLite Direction

Recommended model for now:

```text
One StoreLite deployment = one store
```

Each store should have its own:

- GitHub repository or copied project folder
- Railway project
- `.env` settings
- SQLite database
- Uploads directory
- Domain
- Admin login
- Products, orders, inventory, and branding

Future platform model:

```text
One StoreLite platform = many stores
```

That requires store isolation, shared user accounts, domain routing, and organization-level admin tools.

## Storefront

- DONE: Public storefront homepage
- DONE: Product cards
- DONE: Product detail pages
- DONE: Product search
- DONE: Category filtering
- DONE: Theme colors through env vars
- DONE: Store name, tagline, description, support email through env vars
- DONE: Optional logo URL
- DONE: Optional hero image URL
- NEXT: Store pages such as About, Contact, Shipping, Returns, Privacy
- NEXT: SEO fields for title/meta description per product
- NEXT: Featured products
- NEXT: Product recommendations
- NEXT: Sort products by newest, price, name
- NEXT: Product image gallery
- LATER: Theme templates
- LATER: Navigation/menu manager
- LATER: Blog/content pages
- SHOPIFY: Full theme editor
- SHOPIFY: Online Store 2.0 style sections and blocks

## Products

- DONE: Add/edit/delete products
- DONE: Product title
- DONE: Product description
- DONE: Product price
- DONE: Product category
- DONE: Product image upload
- DONE: Active/inactive products
- DONE: Affiliate URL support
- NEXT: SKU
- NEXT: Compare-at price/sale price
- NEXT: Cost per item
- NEXT: Product vendor/brand
- NEXT: Product type
- NEXT: Tags
- NEXT: Multiple product images
- NEXT: Bulk product import/export CSV
- LATER: Product variants such as size/color
- LATER: Variant-specific price, SKU, image, stock
- LATER: Digital products/downloads
- LATER: Product metafields/custom fields
- SHOPIFY: Combined listings
- SHOPIFY: Advanced product taxonomy/category metafields

## Collections And Catalogs

- DONE: Basic category filtering
- NEXT: Manual collections
- NEXT: Collection landing pages
- NEXT: Featured collection blocks
- LATER: Smart/automatic collections by tag, price, stock, vendor
- LATER: Catalogs/customer-specific product sets
- SHOPIFY: B2B catalogs and company-specific pricing

## Cart And Checkout

- DONE: Browser cart with localStorage
- DONE: Server-side price validation
- DONE: Server-side stock validation
- DONE: Stripe Checkout integration
- DONE: Affiliate products bypass cart checkout
- NEXT: Customer email capture before checkout
- NEXT: Shipping address capture
- NEXT: Checkout notes
- NEXT: Cart item count and better cart drawer
- NEXT: Abandoned checkout storage
- LATER: Native checkout page
- LATER: Multiple payment providers
- LATER: Tax calculation
- LATER: Shipping rate calculation
- LATER: Discount codes at checkout
- SHOPIFY: Shopify Checkout equivalent
- SHOPIFY: Shop Pay, Apple Pay, Google Pay, PayPal integration bundle
- SHOPIFY: Checkout extensibility/apps

## Orders

- DONE: Pending order records
- DONE: Paid order records
- DONE: Order item records
- DONE: Admin order list
- DONE: Admin order detail page
- DONE: Stock decrement after success redirect
- NEXT: Stripe webhook payment confirmation
- NEXT: Order customer email
- NEXT: Order status workflow: pending, paid, fulfilled, cancelled, refunded
- NEXT: Order notes
- NEXT: Admin order search/filter
- NEXT: Email order confirmation
- LATER: Refund tracking
- LATER: Partial fulfillment
- LATER: Shipping labels/tracking numbers
- LATER: Draft orders/manual orders
- SHOPIFY: Full order timeline
- SHOPIFY: Fraud analysis
- SHOPIFY: Chargeback workflows

## Customers

- NEXT: Customer table
- NEXT: Save customer email/name/address from orders
- NEXT: Customer order history in admin
- NEXT: Marketing opt-in field
- LATER: Customer accounts/login
- LATER: Customer groups/segments
- LATER: Store credit
- SHOPIFY: Customer metafields
- SHOPIFY: Advanced segmentation and automations

## Inventory

- DONE: Single stock number per product
- DONE: Sold-out handling
- NEXT: Low stock indicator
- NEXT: Inventory adjustment history
- NEXT: Prevent oversell more strictly around payment webhooks
- LATER: Multiple inventory locations
- LATER: Inventory transfers
- LATER: Purchase orders
- LATER: Barcode field
- SHOPIFY: Inventory states and advanced routing
- SHOPIFY: POS-linked inventory

## Shipping And Fulfillment

- NEXT: Basic shipping settings page
- NEXT: Flat-rate shipping
- NEXT: Free shipping threshold
- NEXT: Local pickup option
- LATER: Shipping zones
- LATER: Carrier-calculated shipping
- LATER: Fulfillment status and tracking
- SHOPIFY: Label purchase/printing
- SHOPIFY: Fulfillment network/app integrations
- SHOPIFY: Duties/import taxes

## Taxes

- NEXT: Manual tax rate setting
- NEXT: Tax-inclusive/tax-exclusive display setting
- LATER: Tax by region
- LATER: Tax reports
- SHOPIFY: Shopify Tax equivalent
- SHOPIFY: Automated US/EU/UK tax handling
- SHOPIFY: International duty/import tax collection

## Discounts And Promotions

- NEXT: Discount code table
- NEXT: Percent/fixed amount discounts
- NEXT: Active date range
- NEXT: Usage limit
- NEXT: Minimum order amount
- LATER: Automatic discounts
- LATER: Product/category-specific discounts
- LATER: Buy X get Y
- LATER: Free shipping discount
- SHOPIFY: Gift card discount edge cases
- SHOPIFY: Advanced discount combinations

## Gift Cards

- LATER: Gift card product type
- LATER: Gift card codes and balances
- LATER: Redeem gift card at checkout
- SHOPIFY: Issue gift card directly from admin
- SHOPIFY: Gift card customer emails
- SHOPIFY: Apple Wallet support

## Admin

- DONE: Admin login
- DONE: Product management
- DONE: Order management
- DONE: Dashboard metrics
- NEXT: Admin settings screen for store branding
- NEXT: Admin user management
- NEXT: Role permissions
- NEXT: Activity log
- NEXT: Better dashboard charts
- NEXT: File manager for uploaded images
- LATER: Staff invitations
- LATER: Two-factor authentication
- LATER: Audit log
- SHOPIFY: Granular role-based access control
- SHOPIFY: Managed roles such as merchandiser/customer support/marketer

## Analytics And Reports

- DONE: Basic revenue/order/product counts
- NEXT: Sales over time
- NEXT: Top products
- NEXT: Low stock report
- NEXT: Orders by status
- LATER: Conversion funnel
- LATER: Customer lifetime value
- LATER: Export reports CSV
- SHOPIFY: Organization-wide analytics
- SHOPIFY: Advanced report builder

## Marketing

- NEXT: SEO fields
- NEXT: Social sharing image
- NEXT: Email capture
- LATER: Newsletter integration
- LATER: Coupon campaigns
- LATER: Abandoned cart emails
- SHOPIFY: Marketing automations
- SHOPIFY: Customer segments and campaign attribution

## Apps And Integrations

- DONE: Stripe integration
- NEXT: Webhook endpoint structure
- NEXT: Email provider integration
- NEXT: Google Analytics/Meta Pixel env vars
- LATER: Plugin/app architecture
- LATER: Public API tokens
- LATER: Zapier/Make integration
- SHOPIFY: App store ecosystem
- SHOPIFY: Admin API, Storefront API, Functions, webhooks, app billing

## Files And Media

- DONE: Product image uploads
- DONE: Configurable uploads path
- NEXT: Persistent Railway uploads path `/data/uploads`
- NEXT: Image deletion when product is deleted
- NEXT: File size/type validation already started, improve error UX
- LATER: Image resizing/thumbnails
- LATER: CDN/object storage such as S3/R2
- SHOPIFY: Full file library

## Payments

- DONE: Stripe Checkout support
- NEXT: Stripe webhook
- NEXT: Store Stripe publishable/account status in settings
- LATER: Manual payment methods
- LATER: Cash on delivery/manual invoice
- SHOPIFY: Shopify Payments
- SHOPIFY: Shop Pay installments
- SHOPIFY: Multi-provider payment routing

## International / Markets

- DONE: Single store currency via env var
- NEXT: Per-store language/currency settings
- LATER: Multiple currencies
- LATER: Region-specific pricing
- LATER: International domains/subfolders
- LATER: Translations
- SHOPIFY: Markets
- SHOPIFY: Managed Markets
- SHOPIFY: Duties, taxes, local payment methods, merchant-of-record features

## Multi-Store / Organization Model

- CURRENT: Separate deployment per store
- NEXT: New-site checklist and env template
- NEXT: Shared starter repository for copying new stores
- LATER: StoreLite Manager app
- LATER: `stores` table
- LATER: `store_id` on products, orders, admins, settings, uploads
- LATER: Domain-to-store routing
- LATER: Organization users
- LATER: Store-specific roles
- LATER: Organization dashboard across stores
- LATER: Cross-store billing/settings
- LATER: Store creation wizard
- SHOPIFY: Organization owner and store owner model
- SHOPIFY: Organization-level permissions
- SHOPIFY: Expansion stores
- SHOPIFY: Multi-store analytics
- SHOPIFY: Organization billing and security settings

## Security

- DONE: Password hashing with bcrypt
- DONE: Session cookies with httpOnly/sameSite/secure in production
- DONE: Server-side cart validation
- DONE: Basic HTML escaping
- NEXT: Strong default session secret warning
- NEXT: CSRF protection for admin forms
- NEXT: Login rate limiting
- NEXT: Helmet/security headers
- NEXT: Admin password change flow
- NEXT: File upload error handling
- LATER: Two-factor authentication
- LATER: Role-based permissions
- LATER: Separate admin audit log
- SHOPIFY: Enterprise identity/SCIM/SSO on advanced plans

## Deployment

- DONE: Railway config
- DONE: Node start command
- DONE: SQLite database support
- DONE: `.env.example`
- DONE: `.env.site.example`
- DONE: GitHub push script
- NEXT: Railway deployment guide with screenshots/steps
- NEXT: Health check endpoint
- NEXT: Backup/restore instructions for SQLite
- NEXT: Seed/demo data command
- LATER: Dockerfile
- LATER: Automated migrations
- LATER: Managed Postgres option for larger stores

## Highest Priority Next Build Items

1. Stripe webhook for real payment confirmation.
2. Customer email/address capture and customer table.
3. Admin settings page so branding can be edited without changing env vars.
4. Product variants with SKU and per-variant inventory.
5. Discount codes.
6. Shipping/tax basics.
7. CSRF protection and login rate limiting.
8. StoreLite Manager concept for managing many stores later.
