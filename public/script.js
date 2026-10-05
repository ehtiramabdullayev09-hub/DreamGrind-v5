let products = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to load products');
            return;
        }

        products = data.products || [];
        renderProducts();
    } catch (error) {
        console.error('Product loading error:', error);
    }
}


const state = { category: 'All', wishlist: new Set(JSON.parse(localStorage.getItem('dg_wishlist') || '[]')), cart: JSON.parse(localStorage.getItem('dg_cart') || '[]') };
let toastTimer = null;
const $ = id => document.getElementById(id);
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
function money(value, currency = 'USD') { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value); }
function currencyConfig() {
  const country = localStorage.getItem('dg_country') || 'US';

  const configs = {
    US: { country: 'US', currency: 'USD', rate: 1 },
    CA: { country: 'CA', currency: 'CAD', rate: 1.36 },
    UK: { country: 'UK', currency: 'GBP', rate: 0.75 }
  };

  return configs[country] || configs.US;
}

function syncCountryPicker() {
  const c = currencyConfig();

  const picker = $('countryPicker');
  if (picker) picker.value = c.country;

  const label = $('currencyLabel');
  if (label) label.textContent = c.currency;
}
function setCountry(country) {
  localStorage.setItem('dg_country', country);
  syncCountryPicker();
  renderProducts();
  showToast('Shipping country updated');

}
function displayPrice(value) { const c = currencyConfig(); return money(value * c.rate, c.currency); }
function saveAll() { localStorage.setItem('dg_wishlist', JSON.stringify([...state.wishlist])); localStorage.setItem('dg_cart', JSON.stringify(state.cart)); updateCounts(); }
function updateCounts() { $('wishCount').textContent = state.wishlist.size; $('cartCount').textContent = state.cart.reduce((n, x) => n + x.qty, 0); }
function showToast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.remove('hidden'); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 2200); }
function renderProducts() { const q = ($('searchInput')?.value || '').trim().toLowerCase(); const sort = $('sortSelect')?.value || 'featured'; let list = products.filter(p => (state.category === 'All' || p.category === state.category) && (!q || `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q))); if (sort === 'rating') list.sort((a, b) => b.rating - a.rating); if (sort === 'low') list.sort((a, b) => a.price - b.price); if (sort === 'high') list.sort((a, b) => b.price - a.price); $('shopTitle').textContent = state.category === 'All' ? 'Trending products' : `${state.category} products`; $('emptyResults').classList.toggle('hidden', list.length > 0); $('productGrid').innerHTML = list.map(cardHtml).join(''); document.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('active', ch.textContent === state.category)); }
function cardHtml(p) {
  const wished = state.wishlist.has(p.id);

  const image =
    (p.images && p.images.length)
      ? p.images[0]
      : (p.image || '');

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        ${
          image
            ? `<img
                src="${image}"
                alt="${escapeHtml(p.title)}"
                loading="lazy"
                onclick="openProduct(${p.id})"
                style="cursor:pointer"
              >`
            : `<div class="product-image-placeholder">No image</div>`
        }

        ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ''}

        <button
          class="wish-btn ${wished ? 'active' : ''}"
          aria-label="Toggle wishlist"
          onclick="toggleWishlist(${p.id})"
        >
          ${wished ? '♥' : '♡'}
        </button>
      </div>

      <div class="product-info">
        <div class="product-category">
          ${escapeHtml(p.category || 'General')}
        </div>

        <div class="product-title">
          ${escapeHtml(p.title)}
        </div>

        <div class="product-rating">
          ★ ${p.rating ?? 5} · ${p.reviews ?? 0} reviews
        </div>

        <div class="product-bottom">
          <div class="price">
            ${displayPrice(p.price)}
            ${
              p.oldPrice
                ? `<span class="price-old">${displayPrice(p.oldPrice)}</span>`
                : ''
            }
          </div>

          <button
            class="add-mini"
            onclick="quickAdd(${p.id})"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  `;
}
function setCategory(name) { state.category = name; renderProducts(); location.hash = 'shop'; }
function clearFilters() { state.category = 'All'; $('searchInput').value = ''; renderProducts(); }
function toggleSearch() { $('searchPanel').classList.toggle('hidden'); if (!$('searchPanel').classList.contains('hidden')) $('searchInput').focus(); }
$('searchInput').addEventListener('input', renderProducts);
function toggleMobileMenu() { $('mobileNav').classList.toggle('hidden'); }
function closeMobileMenu() { $('mobileNav').classList.add('hidden'); }
function goTop(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function toggleWishlist(id) { state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id); saveAll(); renderProducts(); showToast(state.wishlist.has(id) ? 'Added to wishlist' : 'Removed from wishlist'); }
function openWishlist() { const list = products.filter(p => state.wishlist.has(p.id)); $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>Wishlist</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${list.length ? `<div class="product-grid" style="grid-template-columns:repeat(2,1fr);padding:0">${list.map(cardHtml).join('')}</div>` : '<p class="muted">Your wishlist is empty.</p>'}</div></div>`; }
function quickAdd(id) { const item = state.cart.find(x => x.id === id); if (item) item.qty++; else state.cart.push({ id, qty: 1, variant: null }); saveAll(); showToast('Added to cart'); openCart(); }
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const images = (p.images && p.images.length)
    ? p.images
    : (p.image ? [p.image] : []);

  const mainImage = images[0] || '';

  $('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">

        <div class="modal-head">
          <h2>Product details</h2>
          <button class="close-btn" onclick="closeModal()">✕</button>
        </div>

        <div class="product-detail">

          <div class="product-gallery">

            <div class="main-product-media">
              ${
                mainImage
                  ? `<img id="mainProductImage"
                      src="${mainImage}"
                      alt="${escapeHtml(p.title)}">`
                  : `<div class="product-image-placeholder">No product image</div>`
              }
            </div>

            ${
              images.length > 1
                ? `<div class="product-thumbnails">
                    ${images.map((img, i) => `
                      <button
                        type="button"
                        class="product-thumb ${i === 0 ? 'active' : ''}"
                        onclick="changeProductImage('${img.replace(/'/g, "\\'")}', this)">
                        <img src="${img}" alt="${escapeHtml(p.title)} ${i + 1}">
                      </button>
                    `).join('')}
                  </div>`
                : ''
            }

            ${
              p.video
                ? `
                  <div class="product-video">
                    <video controls playsinline preload="metadata">
                      <source src="${p.video}" type="video/mp4">
                      Your browser does not support video playback.
                    </video>
                  </div>
                `
                : ''
            }

          </div>

          <div>

            <div class="product-category">
              ${escapeHtml(p.category || 'General')}
            </div>

            <h2>${escapeHtml(p.title)}</h2>

            <div class="product-rating">
              ★ ${p.rating || 5} · ${p.reviews || 0} reviews
            </div>

            <div class="detail-price">
              ${displayPrice(p.price)}
              ${
                p.oldPrice
                  ? ` <span class="price-old">${displayPrice(p.oldPrice)}</span>`
                  : ''
              }
            </div>

            <p class="detail-copy">
              ${escapeHtml(p.description || '')}
            </p>

            ${
              p.variants && p.variants.length
                ? `
                  <label style="font-size:12px;font-weight:900">
                    Choose option
                  </label>

                  <div class="variant-row">
                    ${p.variants.map((v, i) => `
                      <button
                        class="variant ${i === 0 ? 'active' : ''}"
                        onclick="selectVariant(this)">
                        ${escapeHtml(v)}
                      </button>
                    `).join('')}
                  </div>
                `
                : ''
            }

            <div class="detail-qty">
              <label>Qty</label>
              <input
                id="detailQty"
                type="number"
                min="1"
                max="20"
                value="1">
            </div>

            <div class="detail-actions">
              <button
                class="primary-button full"
                onclick="addProductFromDetail(${p.id})">
                Add to cart
              </button>

              <button
                class="secondary-button full"
                onclick="toggleWishlist(${p.id});openProduct(${p.id})">
                ${state.wishlist.has(p.id) ? '♥ Wishlisted' : '♡ Wishlist'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;
}

function changeProductImage(src, button) {
  const main = $('mainProductImage');
  if (!main) return;

  main.src = src;

  document
    .querySelectorAll('.product-thumb')
    .forEach(x => x.classList.remove('active'));

  button.classList.add('active');
}
function selectVariant(button) { button.parentElement.querySelectorAll('.variant').forEach(x => x.classList.remove('active')); button.classList.add('active'); }
function addProductFromDetail(id) { const qty = Math.max(1, Math.min(20, Number($('detailQty').value) || 1)); const variant = document.querySelector('.variant.active')?.textContent || null; const item = state.cart.find(x => x.id === id && x.variant === variant); if (item) item.qty += qty; else state.cart.push({ id, qty, variant }); saveAll(); showToast('Added to cart'); closeModal(); openCart(); }
function cartSubtotal() { return state.cart.reduce((sum, x) => { const p = products.find(p => p.id === x.id); return sum + (p ? p.price * x.qty : 0) }, 0); }
function shippingCost() { const subtotal = cartSubtotal(); return subtotal >= 50 ? 0 : 5.99; }
function openCart() { const c = currencyConfig(); const lines = state.cart.length ? state.cart.map(x => { const p = products.find(p => p.id === x.id); return `<div class="cart-line"><img src="${p.image}" alt=""><div><strong>${escapeHtml(p.title)}</strong><div class="muted">${x.variant ? `Option: ${escapeHtml(x.variant)} · ` : ''}${displayPrice(p.price)} each</div><div class="qty-control"><button onclick="changeQty(${x.id},'${encodeURIComponent(x.variant || '')}',-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${x.id},'${encodeURIComponent(x.variant || '')}',1)">+</button></div></div><strong>${displayPrice(p.price * x.qty)}</strong></div>` }).join('') : `<p class="muted">Your cart is empty.</p>`; const sub = cartSubtotal(); const ship = state.cart.length ? shippingCost() : 0; const total = sub + ship; $('modalRoot').innerHTML = `<div class="overlay" onclick="closeModal(event)"><aside class="drawer"><div class="drawer-head"><h2>Your cart</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${lines}<div class="drawer-section"><label for="countrySelect">Shipping country</label><select id="countrySelect" onchange="setCountry(this.value)"><option value="US" ${c.country === 'US' ? 'selected' : ''}>United States</option><option value="CA" ${c.country === 'CA' ? 'selected' : ''}>Canada</option><option value="UK" ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option></select></div><div class="drawer-section"><input id="couponInput" placeholder="Coupon code (try SAVE10)"></div><div class="summary-row"><span>Subtotal</span><span>${displayPrice(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${ship === 0 ? 'FREE' : displayPrice(ship)}</span></div><div class="summary-row total"><span>Total</span><span>${displayPrice(total)}</span></div><button class="primary-button full" onclick="startCheckout()" ${state.cart.length ? '' : 'disabled'}>Checkout</button><div class="note-box" style="margin-top:12px">Demo checkout only. Real payment processing, tax calculation and secure order creation will be connected after the backend is built.</div></aside></div>`; }
function changeQty(id, variantKey, delta) { const variant = decodeURIComponent(variantKey); const item = state.cart.find(x => x.id === id && (x.variant || '') === variant); if (!item) return; item.qty += delta; if (item.qty <= 0) state.cart = state.cart.filter(x => x !== item); saveAll(); openCart(); }
async function startCheckout() {
    if (!state.cart.length) return;

    const user = await getCurrentUser();

    if (!user) {
        showToast('Please log in or create an account before checkout');
        openAccount();
        return;
    }

    const c = currencyConfig();

    $('modalRoot').innerHTML = `
    <div class="modal-overlay">
        <div class="modal">
            <div class="modal-head">
                <h2>Checkout</h2>
                <button class="close-btn" onclick="closeModal()">✕</button>
            </div>

            <form class="form-grid" onsubmit="submitDemoOrder(event)">
                <label>
                    Full name
                    <input id="coName" required value="${escapeHtml(user.name)}">
                </label>

                <label>
                    Email
                    <input id="coEmail" type="email" required value="${escapeHtml(user.email)}">
                </label>
<label>
  Mobile number
  <input
    id="coPhone"
    type="tel"
    required
    placeholder="+1 555 123 4567 / +44 7700 900123"
  >
</label>
                <label>
                    Address
                    <input id="coAddress" required placeholder="Street address">
                </label>

                <label>
                    City / State / Postal code
                    <input id="coCity" required placeholder="City, State, ZIP">
                </label>

                <label>
                    Country
                    <select id="coCountry">
                        <option ${c.country === 'US' ? 'selected' : ''}>United States</option>
                        <option ${c.country === 'CA' ? 'selected' : ''}>Canada</option>
                        <option ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
                    </select>
                </label>

                <div class="note-box">
                    Payment will be connected after the payment gateway is configured.
                </div>

                <button class="primary-button" type="submit">
                    Create order
                </button>
            </form>
        </div>
    </div>`;
}

    async function getCurrentUser() { const r = await fetch('/api/auth/me', { credentials: 'include' }); const d = await r.json(); return d.user || null; }
    async function openAccount() { const user = await getCurrentUser(); $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>My account</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${user ? accountHome(user) : accountForms()}</div></div>`; if (!user) showLoginForm(); }
    function accountForms() { return `<div class="account-tabs"><button id="loginTab" class="account-tab active" onclick="showLoginForm()">Login</button><button id="registerTab" class="account-tab" onclick="showRegisterForm()">Create account</button></div><div id="accountBody"></div><div class="note-box" style="margin-top:12px">Your password is handled by the server and is not stored in your browser local storage.</div>` }
    function showLoginForm() { $('loginTab').classList.add('active'); $('registerTab').classList.remove('active'); $('accountBody').innerHTML = `<form class="form-grid" onsubmit="loginUser(event)"><label>Email<input id="loginEmail" type="email" required autocomplete="email"></label><label>Password<input id="loginPassword" type="password" required autocomplete="current-password"></label><button class="primary-button" type="submit">Login</button></form>`; }
    function showRegisterForm() { $('loginTab').classList.remove('active'); $('registerTab').classList.add('active'); $('accountBody').innerHTML = `<form class="form-grid" onsubmit="registerUser(event)"><label>Full name<input id="regName" required autocomplete="name"></label><label>Email<input id="regEmail" type="email" required autocomplete="email"></label><label>Password<input id="regPassword" minlength="8" type="password" required autocomplete="new-password"></label><button class="primary-button" type="submit">Create account</button></form>`; }
    async function registerUser(e) { e.preventDefault(); const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: $('regName').value.trim(), email: $('regEmail').value.trim(), password: $('regPassword').value }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to create account'); return; } showToast('Account created'); openAccount(); }
    async function loginUser(e) { e.preventDefault(); const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to sign in'); return; } showToast('Logged in'); openAccount(); }
    function accountHome(user) { return `<p>Welcome back, <strong>${escapeHtml(user.name)}</strong>.</p><div class="note-box">Email: ${escapeHtml(user.email)}<br>Account type: ${user.role === 'admin' ? 'Admin' : 'Customer'}</div><div style="display:grid;gap:8px;margin-top:14px"><button class="secondary-button" onclick="openOrderHistory()">My orders</button><button class="secondary-button" onclick="openSupport()">Message the store</button>${user.role === 'admin' ? '<button class="primary-button" onclick="window.location.href=\'/admin.html\'">Admin panel</button>' : ''}<button class="primary-button" onclick="logoutUser()">Log out</button></div>`; }
    async function logoutUser() { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); openAccount(); }
    async function openOrderHistory() { const r = await fetch('/api/orders/me', { credentials: 'include' }); const d = await r.json(); if (!r.ok) { showToast('Please log in first'); return; } const orders = d.orders || []; $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>My orders</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${orders.length ? orders.map(o => `<div class="note-box" style="margin-bottom:9px"><strong>${escapeHtml(o.id)}</strong><br>${new Date(o.createdAt).toLocaleString()}<br>Status: ${escapeHtml(o.status)}<br>Total: ${displayPrice(o.total || 0)}<br><button class="text-button" onclick="closeModal();$('trackInput').value='${o.id}';trackOrder();location.hash='track'">Track order</button></div>`).join('') : '<p class="muted">No orders yet.</p>'}</div></div>`; }
    async function openSupport() { const r = await fetch('/api/messages/me', { credentials: 'include' }); const d = await r.json(); if (!r.ok) { showToast('Please log in first'); return; } const old = d.messages || []; $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>Contact DreamGrind</h2><button class="close-btn" onclick="closeModal()">✕</button></div><div class="message-list">${old.slice(-8).map(m => `<div class="message"><strong>${m.from === 'customer' ? 'You' : 'DreamGrind'}</strong><br>${escapeHtml(m.text)}<small>${new Date(m.createdAt).toLocaleString()}</small></div>`).join('') || '<p class="muted">No messages yet.</p>'}</div><form class="form-grid" onsubmit="sendMessage(event)"><label>Your message<textarea id="supportMessage" required placeholder="How can we help?"></textarea></label><button class="primary-button" type="submit">Send message</button></form></div></div>`; }
    async function sendMessage(e) { e.preventDefault(); const r = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ text: $('supportMessage').value.trim() }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Please log in first'); return; } showToast('Message sent'); openSupport(); }
    async function submitDemoOrder(e) {
  e.preventDefault();

  const r = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      name: $('coName').value.trim(),
      email: $('coEmail').value.trim(),
      phone: $('coPhone').value.trim(),
      address: $('coAddress').value.trim(),
      city: $('coCity').value.trim(),
      country: $('coCountry').value,
      items: state.cart
    })
  });

  const d = await r.json();

  if (!r.ok) {
    showToast(d.error || 'Please log in before checkout');
    return;
  }

  const order = d.order;

  try {
    const paymentResponse = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        orderId: order.id
      })
    });

    const payment = await paymentResponse.json();

    if (!paymentResponse.ok || !payment.redirect_url) {
      showToast(payment.error || 'Unable to start payment.');
      return;
    }

    state.cart = [];
    saveAll();

    window.location.href = payment.redirect_url;
  } catch (error) {
    console.error('PAYMENT ERROR:', error);
    showToast('Unable to start payment.');
  }
}
    async function trackOrder() { const code = $('trackInput').value.trim().toUpperCase(); if (!code) { $('trackingResult').innerHTML = '<p class="muted">Enter an order number.</p>'; return; } const r = await fetch('/api/orders/track/' + encodeURIComponent(code)); const d = await r.json(); if (!r.ok) { $('trackingResult').innerHTML = '<p class="muted">Order not found.</p>'; return; } const order = d.order; $('trackingResult').innerHTML = `<div class="tracking-result"><div class="tracking-meta"><div><strong>Order ${escapeHtml(order.id)}</strong><div class="muted">Created ${new Date(order.createdAt).toLocaleString()}</div></div><div class="tracking-status">${escapeHtml(order.status)}</div></div><div class="timeline"><div class="step done"><div class="dot"></div><div><strong>Order placed</strong><br><small>Order received</small></div></div><div class="step done"><div class="dot"></div><div><strong>Processing</strong><br><small>Preparing your order</small></div></div><div class="step ${order.status === 'Shipped' || order.status === 'In transit' || order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>Shipped</strong><br><small>Tracking number assigned</small></div></div><div class="step ${order.status === 'In transit' || order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>In transit</strong><br><small>Package moving through carrier network</small></div></div><div class="step ${order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>Delivered</strong><br><small>Final carrier scan</small></div></div></div></div>`; }
    function showPolicy(type) { const copy = { shipping: { title: 'Shipping policy', html: '<p>Shipping rules shown here are placeholders for the development version.</p><h3>Destinations</h3><p>USA, Canada and UK are enabled in the store interface.</p><h3>Rates</h3><p>Free shipping can be configured for selected orders; the demo currently uses a simple threshold-based estimate.</p>' }, returns: { title: 'Returns & refunds', html: '<p>This development policy is a placeholder. Before launch, you must publish your actual return window, exclusions, refund timing and customer-service contact details.</p>' }, privacy: { title: 'Privacy', html: '<p>This development page is a placeholder. The production store must include an accurate privacy policy describing what customer data is collected, why it is used, retention and third-party processors.</p>' }, terms: { title: 'Terms', html: '<p>This development page is a placeholder. Production terms should reflect the actual business entity, payment provider, shipping terms, jurisdiction and customer rules.</p>' }, cookies: { title: 'Cookies', html: '<p>This development page is a placeholder. The production site should document essential cookies and any analytics/advertising cookies used.</p>' } }[type]; $('modalRoot').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal"><div class="modal-head"><h2>${copy.title}</h2><button class="close-btn" onclick="closeModal()">✕</button></div><div class="policy-copy">${copy.html}</div></div></div>`; }
    async function subscribe(e) { e.preventDefault(); const email = $('newsletterEmail').value.trim(); const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to subscribe'); return; } $('newsletterEmail').value = ''; showToast('Subscribed'); }
    function closeModal(e) { if (e && e.target !== e.currentTarget) return; $('modalRoot').innerHTML = ''; }

    syncCountryPicker();
    saveAll(); 
   loadProducts();
