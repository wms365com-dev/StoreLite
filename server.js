require('dotenv').config();

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_NAME = process.env.STORE_NAME || 'Shop Lite';
const CURRENCY = (process.env.CURRENCY || 'CAD').toUpperCase();
const DB_PATH = process.env.DATABASE_PATH || './data/store.db';
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync('./uploads', { recursive: true });
const db = new Database(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CAD',
  stock INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  affiliate_url TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT DEFAULT '',
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  stripe_session_id TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  title TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);
`);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
const existingAdmin = db.prepare('SELECT id FROM admins WHERE email=?').get(adminEmail);
if (!existingAdmin) {
  db.prepare('INSERT INTO admins (email,password_hash) VALUES (?,?)').run(adminEmail, bcrypt.hashSync(adminPassword, 10));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed.'));
    cb(null, true);
  }
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function money(cents, currency = CURRENCY) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format((cents || 0) / 100);
}

function parsePrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function normalizeQty(value) {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 1) return 1;
  return Math.min(qty, 99);
}

function isSafeUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function layout(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/public/style.css"></head><body><header><a class="brand" href="/">${escapeHtml(STORE_NAME)}</a><nav><a href="/">Shop</a><a href="/cart">Cart <span id="cartCount"></span></a><a href="/admin">Admin</a></nav></header><main>${body}</main><footer>&copy; ${new Date().getFullYear()} ${escapeHtml(STORE_NAME)}</footer><script src="/public/app.js"></script></body></html>`;
}

function requireAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin/login');
}

function productCard(p) {
  const image = escapeHtml(p.image_url || '/public/placeholder.svg');
  const stockLabel = p.stock > 0 ? `${p.stock} in stock` : 'Sold out';
  const action = p.affiliate_url
    ? `<a class="btn" target="_blank" rel="noopener noreferrer" href="${escapeHtml(p.affiliate_url)}">Buy / View Deal</a>`
    : `<button class="btn" ${p.stock < 1 ? 'disabled' : ''} data-add-to-cart="${p.id}">${p.stock < 1 ? 'Sold Out' : 'Add to Cart'}</button>`;
  return `<article class="card"><a href="/products/${p.id}"><img src="${image}" alt=""></a><div class="product-copy"><p class="eyebrow">${escapeHtml(p.category || 'Product')}</p><h3><a href="/products/${p.id}">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.description || '')}</p></div><div class="row"><strong>${money(p.price_cents, p.currency)}</strong><span>${escapeHtml(stockLabel)}</span></div>${action}</article>`;
}

function getCategories() {
  return db.prepare("SELECT DISTINCT category FROM products WHERE active=1 AND category<>'' ORDER BY category").all();
}

function buildCart(rawCart) {
  const items = Array.isArray(rawCart) ? rawCart : [];
  const compact = new Map();
  for (const item of items) {
    const id = Number(item.id);
    if (!Number.isInteger(id)) continue;
    compact.set(id, (compact.get(id) || 0) + normalizeQty(item.qty));
  }

  const result = [];
  let total = 0;
  for (const [id, requestedQty] of compact.entries()) {
    const product = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(id);
    if (!product || product.affiliate_url) continue;
    const qty = Math.min(requestedQty, Math.max(product.stock, 0));
    if (qty < 1) continue;
    const lineTotal = product.price_cents * qty;
    total += lineTotal;
    result.push({
      id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      currency: product.currency,
      image_url: product.image_url,
      stock: product.stock,
      qty,
      line_total_cents: lineTotal
    });
  }
  return { items: result, total_cents: total, currency: CURRENCY };
}

function appendSuccessParams(baseUrl, publicId) {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}order=${encodeURIComponent(publicId)}&session_id={CHECKOUT_SESSION_ID}`;
}

app.get('/', (req, res) => {
  const category = String(req.query.category || '');
  const q = String(req.query.q || '').trim();
  const categories = getCategories();
  const where = ['active=1'];
  const params = {};
  if (category) {
    where.push('category=@category');
    params.category = category;
  }
  if (q) {
    where.push('(title LIKE @search OR description LIKE @search)');
    params.search = `%${q}%`;
  }
  const products = db.prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY created_at DESC`).all(params);
  const categoryLinks = categories.map(({ category: name }) => `<a class="${name === category ? 'active' : ''}" href="/?category=${encodeURIComponent(name)}">${escapeHtml(name)}</a>`).join('');
  const cards = products.map(productCard).join('') || '<p class="empty">No products match this view.</p>';
  res.send(layout(STORE_NAME, `<section class="hero"><div><p class="eyebrow">Online store</p><h1>${escapeHtml(STORE_NAME)}</h1><p>Sell products, manage inventory, collect Stripe checkout payments, and keep an admin order trail.</p></div><form class="search" method="get"><input name="q" value="${escapeHtml(q)}" placeholder="Search products"><button class="btn">Search</button></form></section><div class="tabs"><a class="${!category ? 'active' : ''}" href="/">All</a>${categoryLinks}</div><div class="grid">${cards}</div>`));
});

app.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(req.params.id);
  if (!p) return res.status(404).send(layout('Not found', '<h1>Product not found</h1><a class="btn" href="/">Back to shop</a>'));
  const action = p.affiliate_url
    ? `<a class="btn" target="_blank" rel="noopener noreferrer" href="${escapeHtml(p.affiliate_url)}">Buy / View Deal</a>`
    : `<button class="btn" ${p.stock < 1 ? 'disabled' : ''} data-add-to-cart="${p.id}">${p.stock < 1 ? 'Sold Out' : 'Add to Cart'}</button>`;
  res.send(layout(p.title, `<section class="product-detail"><img src="${escapeHtml(p.image_url || '/public/placeholder.svg')}" alt=""><div><p class="eyebrow">${escapeHtml(p.category || 'Product')}</p><h1>${escapeHtml(p.title)}</h1><p>${escapeHtml(p.description || '')}</p><div class="price">${money(p.price_cents, p.currency)}</div><p>${p.stock > 0 ? `${p.stock} in stock` : 'Sold out'}</p>${action}</div></section>`));
});

app.get('/cart', (req, res) => {
  res.send(layout('Cart', `<h1>Your Cart</h1><div id="cartBox"></div><form method="post" action="/checkout" id="checkoutForm"><input type="hidden" name="cart" id="cartInput"><button class="btn">Checkout</button></form>`));
});

app.post('/api/cart', (req, res) => {
  res.json(buildCart(req.body.cart));
});

app.post('/checkout', async (req, res, next) => {
  try {
    if (!stripe) return res.send(layout('Stripe not connected', '<h1>Stripe is not connected</h1><p>Add STRIPE_SECRET_KEY in Railway variables, then redeploy.</p><a class="btn" href="/cart">Back</a>'));
    const parsedCart = JSON.parse(req.body.cart || '[]');
    const cart = buildCart(parsedCart);
    if (!cart.items.length) return res.redirect('/cart');

    const publicId = crypto.randomBytes(10).toString('hex');
    const insertOrder = db.prepare('INSERT INTO orders (public_id,status,total_cents,currency) VALUES (?,?,?,?)');
    const insertItem = db.prepare('INSERT INTO order_items (order_id,product_id,title,qty,price_cents) VALUES (?,?,?,?,?)');
    const orderId = db.transaction(() => {
      const order = insertOrder.run(publicId, 'pending', cart.total_cents, cart.currency);
      for (const item of cart.items) insertItem.run(order.lastInsertRowid, item.id, item.title, item.qty, item.price_cents);
      return order.lastInsertRowid;
    })();

    const line_items = cart.items.map(item => ({
      price_data: {
        currency: cart.currency.toLowerCase(),
        product_data: { name: item.title },
        unit_amount: item.price_cents
      },
      quantity: item.qty
    }));
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      metadata: { order_id: String(orderId), public_id: publicId },
      success_url: appendSuccessParams(process.env.SUCCESS_URL || `${req.protocol}://${req.get('host')}/success`, publicId),
      cancel_url: process.env.CANCEL_URL || `${req.protocol}://${req.get('host')}/cart`
    });
    db.prepare('UPDATE orders SET stripe_session_id=? WHERE id=?').run(checkoutSession.id, orderId);
    res.redirect(checkoutSession.url);
  } catch (err) {
    next(err);
  }
});

app.get('/success', (req, res) => {
  const publicId = String(req.query.order || '');
  const order = publicId ? db.prepare('SELECT * FROM orders WHERE public_id=?').get(publicId) : null;
  if (order && order.status === 'pending') {
    db.prepare("UPDATE orders SET status='paid', paid_at=CURRENT_TIMESTAMP WHERE id=?").run(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
    const decrement = db.prepare('UPDATE products SET stock=MAX(stock - ?, 0) WHERE id=?');
    db.transaction(() => {
      for (const item of items) if (item.product_id) decrement.run(item.qty, item.product_id);
    })();
  }
  res.send(layout('Success', `<h1>Thank you!</h1><p>Your payment was completed${order ? ` for order ${escapeHtml(order.public_id)}` : ''}.</p><a class="btn" href="/">Continue shopping</a><script>localStorage.removeItem('cart');</script>`));
});

app.get('/admin/login', (req, res) => {
  res.send(layout('Admin Login', `<div class="panel narrow"><h1>Admin Login</h1><form method="post"><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required></label><button class="btn">Login</button></form></div>`));
});

app.post('/admin/login', (req, res) => {
  const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(req.body.email);
  if (admin && bcrypt.compareSync(req.body.password, admin.password_hash)) {
    req.session.adminId = admin.id;
    return res.redirect('/admin');
  }
  res.status(401).send(layout('Login failed', '<div class="panel narrow"><p>Login failed.</p><a class="btn" href="/admin/login">Try again</a></div>'));
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/admin', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all().map(p => `<tr><td>${p.id}</td><td><a href="/admin/edit/${p.id}">${escapeHtml(p.title)}</a></td><td>${money(p.price_cents, p.currency)}</td><td>${p.stock}</td><td>${escapeHtml(p.category || '')}</td><td>${p.active ? 'Yes' : 'No'}</td></tr>`).join('');
  const metrics = db.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents),0) AS revenue FROM orders WHERE status='paid'").get();
  res.send(layout('Admin', `<h1>Admin Dashboard</h1><div class="stats"><div><span>Products</span><strong>${db.prepare('SELECT COUNT(*) AS count FROM products').get().count}</strong></div><div><span>Paid orders</span><strong>${metrics.orders}</strong></div><div><span>Revenue</span><strong>${money(metrics.revenue, CURRENCY)}</strong></div></div><p class="actions"><a class="btn" href="/admin/new">Add Product</a><a class="btn light" href="/admin/orders">Orders</a><a class="btn light" href="/admin/logout">Logout</a></p><table><tr><th>ID</th><th>Title</th><th>Price</th><th>Stock</th><th>Category</th><th>Active</th></tr>${rows || '<tr><td colspan="6">No products yet.</td></tr>'}</table>`));
});

app.get('/admin/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 100').all();
  const rows = orders.map(o => `<tr><td><a href="/admin/orders/${o.id}">${escapeHtml(o.public_id)}</a></td><td>${escapeHtml(o.status)}</td><td>${money(o.total_cents, o.currency)}</td><td>${escapeHtml(o.created_at)}</td></tr>`).join('');
  res.send(layout('Orders', `<h1>Orders</h1><p><a class="btn light" href="/admin">Back</a></p><table><tr><th>Order</th><th>Status</th><th>Total</th><th>Created</th></tr>${rows || '<tr><td colspan="4">No orders yet.</td></tr>'}</table>`));
});

app.get('/admin/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).send('Not found');
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const rows = items.map(i => `<tr><td>${escapeHtml(i.title)}</td><td>${i.qty}</td><td>${money(i.price_cents, order.currency)}</td><td>${money(i.price_cents * i.qty, order.currency)}</td></tr>`).join('');
  res.send(layout(`Order ${order.public_id}`, `<h1>Order ${escapeHtml(order.public_id)}</h1><div class="panel"><p><strong>Status:</strong> ${escapeHtml(order.status)}</p><p><strong>Total:</strong> ${money(order.total_cents, order.currency)}</p><p><strong>Stripe session:</strong> ${escapeHtml(order.stripe_session_id || 'None')}</p></div><table><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table><p><a class="btn light" href="/admin/orders">Back to orders</a></p>`));
});

function productForm(p = {}) {
  return `<div class="panel"><form method="post" enctype="multipart/form-data"><label>Title<input name="title" value="${escapeHtml(p.title || '')}" required></label><label>Description<textarea name="description">${escapeHtml(p.description || '')}</textarea></label><div class="form-grid"><label>Price <small>example 19.99</small><input name="price" value="${p.price_cents ? (p.price_cents / 100).toFixed(2) : ''}" required></label><label>Stock<input name="stock" type="number" min="0" value="${p.stock || 0}"></label></div><label>Category<input name="category" value="${escapeHtml(p.category || '')}"></label><label>Affiliate URL <small>optional. If used, it replaces cart checkout.</small><input name="affiliate_url" value="${escapeHtml(p.affiliate_url || '')}"></label><label>Product Image<input name="image" type="file" accept="image/*"></label><label class="check"><input name="active" type="checkbox" ${p.active !== 0 ? 'checked' : ''}> Active</label><button class="btn">Save</button></form></div>`;
}

app.get('/admin/new', requireAdmin, (req, res) => {
  res.send(layout('New Product', `<h1>New Product</h1>${productForm()}`));
});

app.post('/admin/new', requireAdmin, upload.single('image'), (req, res) => {
  const affiliateUrl = String(req.body.affiliate_url || '').trim();
  if (!isSafeUrl(affiliateUrl)) return res.status(400).send(layout('Invalid URL', '<p>Affiliate URL must start with http:// or https://.</p>'));
  const img = req.file ? `/uploads/${req.file.filename}` : '';
  db.prepare('INSERT INTO products (title,description,price_cents,currency,stock,category,image_url,affiliate_url,active) VALUES (?,?,?,?,?,?,?,?,?)').run(
    req.body.title,
    req.body.description,
    parsePrice(req.body.price),
    CURRENCY,
    Number(req.body.stock || 0),
    req.body.category,
    img,
    affiliateUrl,
    req.body.active ? 1 : 0
  );
  res.redirect('/admin');
});

app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).send('Not found');
  res.send(layout('Edit Product', `<h1>Edit Product</h1>${productForm(p)}<form method="post" action="/admin/delete/${p.id}" onsubmit="return confirm('Delete product?')"><button class="danger">Delete</button></form>`));
});

app.post('/admin/edit/:id', requireAdmin, upload.single('image'), (req, res) => {
  const old = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).send('Not found');
  const affiliateUrl = String(req.body.affiliate_url || '').trim();
  if (!isSafeUrl(affiliateUrl)) return res.status(400).send(layout('Invalid URL', '<p>Affiliate URL must start with http:// or https://.</p>'));
  const img = req.file ? `/uploads/${req.file.filename}` : old.image_url;
  db.prepare('UPDATE products SET title=?,description=?,price_cents=?,stock=?,category=?,image_url=?,affiliate_url=?,active=? WHERE id=?').run(
    req.body.title,
    req.body.description,
    parsePrice(req.body.price),
    Number(req.body.stock || 0),
    req.body.category,
    img,
    affiliateUrl,
    req.body.active ? 1 : 0,
    req.params.id
  );
  res.redirect('/admin');
});

app.post('/admin/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.redirect('/admin');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(layout('Server error', '<h1>Something went wrong</h1><p>Please try again.</p>'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`${STORE_NAME} running on ${PORT}`));
}

module.exports = app;
