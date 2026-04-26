function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count ? `(${count})` : '';
}

function addToCart(id) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  renderCart();
}

async function priceCart() {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart: getCart() })
  });
  if (!response.ok) throw new Error('Could not price cart');
  return response.json();
}

function formatMoney(cents, currency) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format((cents || 0) / 100);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

async function renderCart() {
  const box = document.getElementById('cartBox');
  if (!box) return;
  box.innerHTML = '<p>Loading cart...</p>';
  try {
    const priced = await priceCart();
    saveCart(priced.items.map(item => ({ id: item.id, qty: item.qty })));
    if (!priced.items.length) {
      box.innerHTML = '<p>Your cart is empty.</p>';
      const checkout = document.getElementById('checkoutForm');
      if (checkout) checkout.hidden = true;
      return;
    }
    box.innerHTML = priced.items.map(item => `
      <div class="cart-line">
        <img src="${escapeHtml(item.image_url || '/public/placeholder.svg')}" alt="">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${formatMoney(item.price_cents, item.currency)} each</p>
        </div>
        <label>Qty
          <input type="number" min="1" max="${item.stock}" value="${item.qty}" data-cart-qty="${item.id}">
        </label>
        <strong>${formatMoney(item.line_total_cents, item.currency)}</strong>
        <button class="danger small" data-remove-cart="${item.id}">Remove</button>
      </div>
    `).join('') + `<h2>Total: ${formatMoney(priced.total_cents, priced.currency)}</h2>`;
  } catch {
    box.innerHTML = '<p>Cart could not be loaded. Please refresh and try again.</p>';
  }
}

function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);
  if (item) item.qty = Math.max(1, Number(qty || 1));
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  saveCart(getCart().filter(product => product.id !== id));
  renderCart();
}

document.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add-to-cart]');
  if (addButton) addToCart(Number(addButton.dataset.addToCart));

  const removeButton = event.target.closest('[data-remove-cart]');
  if (removeButton) removeItem(Number(removeButton.dataset.removeCart));
});

document.addEventListener('change', event => {
  const qtyInput = event.target.closest('[data-cart-qty]');
  if (qtyInput) updateQty(Number(qtyInput.dataset.cartQty), qtyInput.value);
});

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', () => {
    document.getElementById('cartInput').value = JSON.stringify(getCart());
  });
}

updateCartCount();
renderCart();
