let products = [];
const translations = {
  en: {
    shippingTo: 'Shipping to:',
    shop: 'Shop',
    about: 'About',
    trackOrder: 'Track order',
    categories: 'Categories',
    search: 'Search',
    cart: 'Cart',
    markets: 'USA • CANADA • UK',
browse: 'Browse',
whyDreamGrind: 'Why DreamGrind',
orderStatus: 'Order status',
stayInLoop: 'Stay in the loop'
  },
  az: {
    shippingTo: 'Çatdırılma ölkəsi:',
    shop: 'Mağaza',
    about: 'Haqqımızda',
    trackOrder: 'Sifarişi izlə',
    categories: 'Kateqoriyalar',
    search: 'Axtarış',
    cart: 'Səbət',
    markets: 'ABŞ • KANADA • BK',
browse: 'Kəşf et',
whyDreamGrind: 'Niyə DreamGrind?',
orderStatus: 'Sifariş statusu',
stayInLoop: 'Yeniliklərdən xəbərdar ol'
  }
};

function setLanguage(language) {
  const lang = language === 'az' ? 'az' : 'en';

  localStorage.setItem('dg_language', lang);
  document.documentElement.lang = lang;

  applyLanguage(lang);
}

function applyLanguage(lang) {
  const t = translations[lang] || translations.en;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;

    if (t[key]) {
      element.textContent = t[key];
    }
  });
}

function initLanguage() {
  const savedLanguage = localStorage.getItem('dg_language') || 'en';
  setLanguage(savedLanguage);
}
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
        const initialProductId = new URLSearchParams(window.location.search).get('product');
        if (initialProductId) {
          productPageScrollY = 0;
          renderProductPage(initialProductId);
        }
    } catch (error) {
        console.error('Product loading error:', error);
    }
}


const state = { category: 'All', wishlist: new Set(JSON.parse(localStorage.getItem('dg_wishlist') || '[]')), cart: JSON.parse(localStorage.getItem('dg_cart') || '[]') };
let pendingCheckoutItems = null;
let productPageOpen = false;
let productPageScrollY = 0;
let productSaleTimer = null;
const originalDocumentTitle = document.title;
let toastTimer = null;
const $ = id => document.getElementById(id);
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
const USD_TO_AZN = 1.70;

function money(value, currency = 'AZN') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value);
}

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

  if ($('modalRoot')?.querySelector('.drawer')) {
    openCart();
  }

  showToast('Shipping country updated');
}

function displayPrice(value) { const c = currencyConfig(); return money(value * c.rate, c.currency); }

// A sale stays active only until its configured end time. After expiry, the
// compare-at price becomes the amount shown and charged, both in the UI/server.
function isProductSaleActive(product, now = Date.now()) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  if (!(compareAt > current && current > 0)) return false;
  if (product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return false;
  }
  return true;
}
function effectiveProductPrice(product, now = Date.now()) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  if (compareAt > current && product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return compareAt;
  }
  return current;
}
function productDiscountPercent(product) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  return compareAt > current && current > 0 ? Math.round((compareAt - current) / compareAt * 100) : 0;
}

const PRODUCT_DESCRIPTION_HEADINGS = {
  'overview': 'overview',
  'description': 'overview',
  'product description': 'overview',
  'product details': 'overview',
  'key features': 'features',
  'key benefits': 'features',
  'features': 'features',
  'benefits': 'features',
  'specifications': 'Specifications',
  'technical specifications': 'Specifications',
  'product specifications': 'Specifications',
  'technical details': 'Specifications',
  'how to use': 'How to use',
  'usage instructions': 'How to use',
  "what's included": "What's included",
  'whats included': "What's included",
  'package contents': "What's included",
  'in the box': "What's included",
  'ingredients': 'Ingredients',
  'care instructions': 'Care instructions',
  'care & maintenance': 'Care instructions',
  'shipping info': 'Shipping information',
  'shipping information': 'Shipping information',
  'shipping & returns': 'Shipping & returns',
  'shipping and returns': 'Shipping & returns',
  'returns & refunds': 'Returns & refunds'
};
function normalizeDescriptionHeading(value) {
  return String(value || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
}
function cleanDescriptionLines(lines) {
  let start = 0, end = lines.length;
  while (start < end && !String(lines[start]).trim()) start++;
  while (end > start && !String(lines[end - 1]).trim()) end--;
  return lines.slice(start, end);
}
function parseProductDescription(rawDescription) {
  const lines = String(rawDescription || '').replace(/\r/g, '').split('\n');
  const result = { overview: [], features: [], sections: [] };
  let target = result.overview;
  let foundSection = false;

  for (const line of lines) {
    const match = line.match(/^\s*([^:\n]{2,48})\s*:\s*$/);
    const normalized = match ? normalizeDescriptionHeading(match[1]) : '';
    const kind = normalized ? PRODUCT_DESCRIPTION_HEADINGS[normalized] : null;
    if (kind) {
      foundSection = true;
      if (kind === 'overview') {
        target = result.overview;
      } else if (kind === 'features') {
        target = result.features;
      } else {
        let section = result.sections.find(x => x.title.toLowerCase() === kind.toLowerCase());
        if (!section) {
          section = { title: kind, lines: [] };
          result.sections.push(section);
        }
        target = section.lines;
      }
      continue;
    }
    target.push(line);
  }

  result.overview = cleanDescriptionLines(result.overview);
  result.features = cleanDescriptionLines(result.features);
  result.sections = result.sections.map(section => ({ ...section, lines: cleanDescriptionLines(section.lines) })).filter(section => section.lines.some(line => String(line).trim()));

  // If the author didn't use recognized headings, keep all text together in
  // the overview instead of hiding or reordering anything they wrote.
  if (!foundSection) {
    result.overview = cleanDescriptionLines(lines);
    result.features = [];
    result.sections = [];
  }
  return result;
}
function isDescriptionBullet(line) {
  return /^\s*(?:[•·▪◦✓✔\-*–—]|\d+[.)])\s+/.test(String(line || ''));
}
function stripDescriptionBullet(line) {
  return String(line || '').replace(/^\s*(?:[•·▪◦✓✔\-*–—]|\d+[.)])\s+/, '').trim();
}
function renderProductDescriptionLines(lines, className = '') {
  const cleaned = cleanDescriptionLines(Array.isArray(lines) ? lines : []);
  if (!cleaned.length) return '';
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    if (paragraph.every(line => isDescriptionBullet(line))) {
      blocks.push(`<ul class="product-description-list">${paragraph.map(line => `<li>${escapeHtml(stripDescriptionBullet(line))}</li>`).join('')}</ul>`);
    } else {
      blocks.push(`<p>${paragraph.map(line => escapeHtml(line.trim())).join('<br>')}</p>`);
    }
    paragraph = [];
  };
  cleaned.forEach(line => {
    if (!String(line).trim()) flush();
    else paragraph.push(String(line));
  });
  flush();
  return `<div class="${className}">${blocks.join('')}</div>`;
}
function renderProductFeatureList(lines) {
  const items = cleanDescriptionLines(Array.isArray(lines) ? lines : []).map(stripDescriptionBullet).filter(Boolean);
  if (!items.length) return '';
  return `<ul class="product-page-feature-list">${items.map(item => `<li><span class="product-feature-check" aria-hidden="true">✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>`;
}
function startProductSaleCountdown(product) {
  if (productSaleTimer) clearInterval(productSaleTimer);
  productSaleTimer = null;
  const endAt = Date.parse(product?.saleEndsAt || '');
  const countdown = $('productSaleCountdown');
  if (!countdown || !isProductSaleActive(product) || !Number.isFinite(endAt)) return;

  const update = () => {
    const left = endAt - Date.now();
    if (left <= 0) {
      if (productSaleTimer) clearInterval(productSaleTimer);
      productSaleTimer = null;
      const currentPrice = $('productCurrentPrice');
      if (currentPrice) currentPrice.textContent = displayPrice(effectiveProductPrice(product));
      $('productComparePrice')?.remove();
      $('productDiscountBadge')?.remove();
      $('productSaleOffer')?.remove();
      return;
    }
    const totalSeconds = Math.floor(left / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    countdown.textContent = `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };
  update();
  productSaleTimer = setInterval(update, 1000);
}
function saveAll() { localStorage.setItem('dg_wishlist', JSON.stringify([...state.wishlist])); localStorage.setItem('dg_cart', JSON.stringify(state.cart)); updateCounts(); }
function updateCounts() { $('wishCount').textContent = state.wishlist.size; $('cartCount').textContent = state.cart.reduce((n, x) => n + x.qty, 0); }
function showToast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.remove('hidden'); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 2200); }
function heroCategoryImage(product) {
  if (!product) return '';
  const source = (Array.isArray(product.images) ? product.images.find(Boolean) : '') || product.image || '';
  return source ? String(source) : '';
}

function openHeroCategory(category) {
  setCategory(category);
}

function renderHeroProduct() {
  const grid = $('heroCategoryGrid');
  if (!grid) return;

  const categoryCards = [
    { key: 'Gadgets', overline: 'SMART LITTLE UPGRADES', title: 'Gadgets', description: 'Useful tech for everyday life', placeholder: '✧' },
    { key: 'Home', overline: 'MAKE IT YOUR SPACE', title: 'Home finds', description: 'Small touches for your space', placeholder: '⌂' },
    { key: 'Pet', overline: 'FOR YOUR COMPANIONS', title: 'Pet favorites', description: 'Find something for your best friend', placeholder: '🐾' }
  ];

  grid.innerHTML = categoryCards.map((category, index) => {
    const product = products.find(p => String(p.category || '').trim().toLowerCase() === category.key.toLowerCase() && heroCategoryImage(p));
    const image = heroCategoryImage(product);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(category.title)} collection" loading="eager" decoding="async">`
      : `<span class="hero-category-placeholder" aria-hidden="true">${category.placeholder}</span>`;
    return `
      <button class="hero-category-card ${index === 0 ? 'hero-category-card-main' : ''}" type="button" onclick="openHeroCategory('${category.key}')" aria-label="Explore ${escapeHtml(category.title)}">
        <span class="hero-category-media">${imageMarkup}</span>
        <span class="hero-category-copy">
          <span class="hero-category-overline">${category.overline}</span>
          <span class="hero-category-title-row"><strong>${category.title}</strong><span class="hero-category-arrow" aria-hidden="true">↗</span></span>
          ${index === 0 ? `<span class="hero-category-description">${category.description}</span>` : ''}
        </span>
      </button>`;
  }).join('');
}

function renderProducts() { const q = ($('searchInput')?.value || '').trim().toLowerCase(); const sort = $('sortSelect')?.value || 'featured'; let list = products.filter(p => (state.category === 'All' || p.category === state.category) && (!q || `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q))); if (sort === 'rating') list.sort((a, b) => b.rating - a.rating); if (sort === 'low') list.sort((a, b) => effectiveProductPrice(a) - effectiveProductPrice(b)); if (sort === 'high') list.sort((a, b) => effectiveProductPrice(b) - effectiveProductPrice(a)); $('shopTitle').textContent = state.category === 'All' ? 'Trending products' : `${state.category} products`; $('emptyResults').classList.toggle('hidden', list.length > 0); $('productGrid').innerHTML = list.map(cardHtml).join(''); document.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('active', ch.textContent === state.category)); renderHeroProduct(); }
function cardHtml(p) {
  const wished = state.wishlist.has(p.id);
  const image = (p.images && p.images.length) ? p.images[0] : (p.image || '');
  const saleActive = isProductSaleActive(p);
  const price = effectiveProductPrice(p);
  const discount = saleActive ? productDiscountPercent(p) : 0;
  const ratingMarkup = Number(p.reviews) > 0
    ? `<div class="product-rating">★ ${Number(p.rating ?? 0).toFixed(1)} · ${Number(p.reviews)} reviews</div>`
    : '';
  const saleMarkup = saleActive && discount > 0
    ? `<span class="product-sale-badge">Save ${discount}%</span>`
    : '';

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(p.title)}" loading="lazy" onclick="openProduct(${p.id})" style="cursor:pointer">` : `<div class="product-image-placeholder">No image</div>`}
        ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ''}
        ${saleMarkup}
        <button class="wish-btn ${wished ? 'active' : ''}" aria-label="Toggle wishlist" onclick="toggleWishlist(${p.id})">${wished ? '♥' : '♡'}</button>
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHtml(p.category || 'General')}</div>
        <div class="product-title" role="button" tabindex="0" onclick="openProduct(${p.id})" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();openProduct(${p.id})}" style="cursor:pointer">${escapeHtml(p.title)}</div>
        ${ratingMarkup}
        <div class="product-bottom">
          <div class="price">
            ${displayPrice(price)}
            ${saleActive ? `<span class="price-old">${displayPrice(p.oldPrice)}</span>` : ''}
          </div>
          <button class="add-mini" onclick="quickAdd(${p.id})">Add</button>
        </div>
      </div>
    </article>`;
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
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  if (!productPageOpen) productPageScrollY = window.scrollY || 0;
  const url = new URL(window.location.href);
  url.searchParams.set('product', String(p.id));
  // Keep advertising attribution parameters while making the product shareable.
  history.pushState({ dreamgrindProductId: String(p.id) }, '', `${url.pathname}${url.search}${url.hash}`);
  renderProductPage(p.id);
}

function renderProductPage(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;

  productPageOpen = true;
  document.title = `${p.title} | DreamGrind`;

  const images = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const mainImage = images[0] || '';
  const imageGallery = mainImage
    ? `<div class="main-product-media"><img id="mainProductImage" src="${escapeHtml(mainImage)}" alt="${escapeHtml(p.title)}"></div>`
    : '<div class="main-product-media"><div class="product-image-placeholder">Product image coming soon</div></div>';
  const thumbnails = images.length > 1
    ? `<div class="product-thumbnails" aria-label="Product images">${images.map((img, i) => `
        <button type="button" class="product-thumb ${i === 0 ? 'active' : ''}" aria-label="View image ${i + 1}" onclick="changeProductImage('${String(img).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', this)">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} view ${i + 1}" loading="lazy">
        </button>`).join('')}</div>`
    : '';
  const video = p.video
    ? `<div class="product-video"><video controls playsinline preload="metadata"><source src="${escapeHtml(p.video)}" type="video/mp4">Your browser does not support video playback.</video></div>`
    : '';
  const variants = p.variants && p.variants.length
    ? `<div class="product-page-options"><label class="product-page-label">Choose option</label><div class="variant-row">${p.variants.map(v => `
        <button type="button" class="variant ${p.variants[0] === v ? 'active' : ''}" onclick="selectVariant(this)">${escapeHtml(v)}</button>`).join('')}</div></div>`
    : '';

  const parsedDescription = parseProductDescription(p.description || '');
  const overviewMarkup = renderProductDescriptionLines(parsedDescription.overview, 'product-page-description');
  const featureMarkup = renderProductFeatureList(parsedDescription.features);
  const hasCustomShipping = parsedDescription.sections.some(section => /shipping|returns/i.test(section.title));
  const extraSections = parsedDescription.sections.map(section => `
    <details class="product-page-accordion">
      <summary>${escapeHtml(section.title)}</summary>
      ${renderProductDescriptionLines(section.lines, 'product-page-accordion-content')}
    </details>`).join('');
  const shippingAccordion = hasCustomShipping ? '' : `
    <details class="product-page-accordion">
      <summary>Shipping &amp; returns</summary>
      <div class="product-page-accordion-content"><p>DreamGrind currently accepts orders for the United States, Canada and the United Kingdom. Shipping is currently free. Processing and delivery times may vary by product and destination. Please contact DreamGrind before returning an item so return instructions can be provided.</p></div>
    </details>`;
  const saleActive = isProductSaleActive(p);
  const discount = saleActive ? productDiscountPercent(p) : 0;
  const countdownEnd = Date.parse(p.saleEndsAt || '');
  const showCountdown = saleActive && Number.isFinite(countdownEnd) && countdownEnd > Date.now();
  const currentPrice = effectiveProductPrice(p);
  const ratingMarkup = Number(p.reviews) > 0
    ? `<div class="product-rating" aria-label="Rated ${Number(p.rating ?? 0)} out of 5">★ ${Number(p.rating ?? 0).toFixed(1)} <span class="product-page-reviews">· ${Number(p.reviews)} reviews</span></div>`
    : '';
  const saleMarkup = saleActive
    ? `${discount > 0 ? `<span class="product-page-discount-badge" id="productDiscountBadge">Save ${discount}%</span>` : ''}${`<span class="price-old" id="productComparePrice">${displayPrice(p.oldPrice)}</span>`}`
    : '';

  $('modalRoot').innerHTML = `
    <section class="product-page-overlay" aria-label="Product details">
      <header class="product-page-topbar">
        <div class="product-page-topbar-inner">
          <button class="product-page-back" type="button" onclick="closeProductPage()" aria-label="Back to shop">← <span>Back to shop</span></button>
          <a class="product-page-brand" href="/" onclick="event.preventDefault();closeProductPage();window.scrollTo({top:0,behavior:'smooth'})">DreamGrind</a>
          <button class="product-page-cart" type="button" onclick="closeProductPage();openCart()">Cart <span>${state.cart.reduce((n, x) => n + x.qty, 0)}</span></button>
        </div>
      </header>

      <div class="product-page-shell">
        <nav class="product-page-breadcrumb" aria-label="Breadcrumb"><a href="/" onclick="event.preventDefault();closeProductPage()">Home</a><span>›</span><a href="/#shop" onclick="event.preventDefault();closeProductPage();location.hash='shop'">Shop</a><span>›</span><span>${escapeHtml(p.title)}</span></nav>

        <div class="product-page-layout">
          <section class="product-page-gallery" aria-label="Product gallery">
            ${imageGallery}
            ${thumbnails}
            ${video}
          </section>

          <section class="product-page-info">
            <div class="product-page-category">${escapeHtml(p.category || 'General')}</div>
            <h1 class="product-page-title">${escapeHtml(p.title)}</h1>
            ${ratingMarkup}

            <div class="product-page-price" id="productPriceBlock"><span id="productCurrentPrice">${displayPrice(currentPrice)}</span>${saleMarkup}</div>
            ${showCountdown ? `<div class="product-page-sale-offer" id="productSaleOffer"><span>Limited-time offer ends in</span><strong id="productSaleCountdown" aria-live="off"></strong></div>` : ''}
            <div class="product-page-shipping"><span aria-hidden="true">✓</span> Free shipping <span class="product-page-dot">·</span> Secure checkout by Epoint</div>

            ${featureMarkup}
            ${variants}

            <div class="product-page-quantity"><label for="detailQty" class="product-page-label">Quantity</label><input id="detailQty" type="number" min="1" max="20" value="1" inputmode="numeric"></div>

            <div class="detail-actions product-page-desktop-actions">
              <button class="primary-button full" type="button" onclick="addProductFromDetail(${p.id})">Add to cart</button>
              <button class="buy-now-button full" type="button" onclick="buyNowFromDetail(${p.id})">Buy now <span aria-hidden="true">→</span></button>
            </div>

            <section class="product-page-confidence" aria-label="Shopping information">
              <div class="product-page-confidence-heading"><span class="product-page-confidence-mark" aria-hidden="true">✓</span><strong>Shop with confidence</strong></div>
              <div class="product-page-confidence-grid">
                <div class="product-page-confidence-item"><span class="product-page-confidence-icon" aria-hidden="true">↗</span><div><strong>Free shipping</strong><small>United States, Canada &amp; UK</small></div></div>
                <div class="product-page-confidence-item"><span class="product-page-confidence-icon" aria-hidden="true">▣</span><div><strong>Secure payment</strong><small>Processed through Epoint</small></div></div>
                <div class="product-page-confidence-item"><span class="product-page-confidence-icon" aria-hidden="true">✓</span><div><strong>Guest checkout</strong><small>No account required</small></div></div>
              </div>
              <div class="product-page-confidence-policy">Shipping and returns information is shown below.</div>
            </section>

            ${overviewMarkup ? `<section class="product-page-details-text"><h2 class="product-page-section-title">Product details</h2>${overviewMarkup}</section>` : ''}
            ${(extraSections || shippingAccordion) ? `<section class="product-page-accordions" aria-label="More product information">${extraSections}${shippingAccordion}</section>` : ''}
          </section>
        </div>
      </div>

      <div class="product-page-sticky-actions" aria-label="Purchase actions">
        <button class="product-page-mobile-add" type="button" onclick="addProductFromDetail(${p.id})">Add to cart</button>
        <button class="product-page-mobile-buy" type="button" onclick="buyNowFromDetail(${p.id})">Buy now →</button>
      </div>
    </section>`;

  const page = $('modalRoot').querySelector('.product-page-overlay');
  if (page) page.scrollTop = 0;
  startProductSaleCountdown(p);
}
function dismissProductPage(updateUrl = true) {
  if (productSaleTimer) clearInterval(productSaleTimer);
  productSaleTimer = null;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  if ($('modalRoot')?.querySelector('.product-page-overlay')) $('modalRoot').innerHTML = '';
  productPageOpen = false;
  document.title = originalDocumentTitle;
  window.scrollTo({ top: Math.max(0, productPageScrollY), behavior: 'auto' });
}

function closeProductPage() {
  dismissProductPage(true);
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
function addProductFromDetail(id) { const qty = Math.max(1, Math.min(20, Number($('detailQty')?.value) || 1)); const variant = document.querySelector('.variant.active')?.textContent.trim() || null; const item = state.cart.find(x => x.id === id && x.variant === variant); if (item) item.qty += qty; else state.cart.push({ id, qty, variant }); saveAll(); showToast('Added to cart'); if (productPageOpen) dismissProductPage(true); else closeModal(); openCart(); }
function buyNowFromDetail(id) { const product = products.find(x => String(x.id) === String(id)); if (!product) return; const qty = Math.max(1, Math.min(20, Number($('detailQty')?.value) || 1)); const variant = document.querySelector('.variant.active')?.textContent.trim() || null; if (productPageOpen) dismissProductPage(true); startCheckout([{ id: Number(product.id), qty, variant }]); }
function cartSubtotal() { return state.cart.reduce((sum, x) => { const p = products.find(p => p.id === x.id); return sum + (p ? effectiveProductPrice(p) * x.qty : 0) }, 0); }
function shippingCost() {
  return 0;
}
function openCart() { const c = currencyConfig(); const lines = state.cart.length ? state.cart.map(x => { const p = products.find(p => p.id === x.id); return `<div class="cart-line"><img src="${(p.images && p.images.length) ? p.images[0] : (p.image || '')}" alt="${escapeHtml(p.title)}"><div><strong>${escapeHtml(p.title)}</strong><div class="muted">${x.variant ? `Option: ${escapeHtml(x.variant)} · ` : ''}${displayPrice(effectiveProductPrice(p))} each</div><div class="qty-control"><button onclick="changeQty(${x.id},'${encodeURIComponent(x.variant || '')}',-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${x.id},'${encodeURIComponent(x.variant || '')}',1)">+</button></div></div><strong>${displayPrice(effectiveProductPrice(p) * x.qty)}</strong></div>` }).join('') : `<p class="muted">Your cart is empty.</p>`; const sub = cartSubtotal(); const ship = state.cart.length ? shippingCost() : 0; const total = sub + ship; $('modalRoot').innerHTML = `<div class="overlay" onclick="closeModal(event)"><aside class="drawer"><div class="drawer-head"><h2>Your cart</h2><button class="close-btn" onclick="closeModal()">✕</button></div>${lines}<div class="drawer-section"><label for="countrySelect">Shipping country</label><select id="countrySelect" onchange="setCountry(this.value)"><option value="US" ${c.country === 'US' ? 'selected' : ''}>United States</option><option value="CA" ${c.country === 'CA' ? 'selected' : ''}>Canada</option><option value="UK" ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option></select></div><div class="drawer-section"><input id="couponInput" placeholder="Coupon code (try SAVE10)"></div><div class="summary-row"><span>Subtotal</span><span>${displayPrice(sub)}</span></div><div class="summary-row"><span>Shipping</span><span>${ship === 0 ? 'FREE' : displayPrice(ship)}</span></div><div class="summary-row total"><span>Total</span><span>${displayPrice(total)}</span></div><button class="primary-button full" onclick="startCheckout()" ${state.cart.length ? '' : 'disabled'}>Checkout</button><div class="note-box" style="margin-top:12px">You will be charged in AZN. Secure by Epoint.</div></aside></div>`; }
function changeQty(id, variantKey, delta) { const variant = decodeURIComponent(variantKey); const item = state.cart.find(x => x.id === id && (x.variant || '') === variant); if (!item) return; item.qty += delta; if (item.qty <= 0) state.cart = state.cart.filter(x => x !== item); saveAll(); openCart(); }
async function startCheckout(items = null) {
  const sourceItems = Array.isArray(items) ? items : state.cart;
  const checkoutItems = sourceItems
    .map(item => ({ id: Number(item.id), qty: Math.max(1, Math.min(20, Number(item.qty) || 1)), variant: item.variant ?? null }))
    .filter(item => Number.isInteger(item.id) && item.id > 0 && item.qty > 0);

  if (!checkoutItems.length) {
    showToast('Your cart is empty');
    return;
  }

  // Keep a snapshot so Buy now purchases only the selected product.
  // Remember checkout mode across the Epoint redirect, so a Buy now payment
  // never clears other items already saved in the customer's cart.
  pendingCheckoutItems = checkoutItems;
  sessionStorage.setItem('dg_checkout_mode', Array.isArray(items) ? 'buy-now' : 'cart');

  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.warn('Unable to check account session; continuing as guest.', error);
  }

  const c = currencyConfig();
  $('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head">
          <h2>Checkout</h2>
          <button class="close-btn" onclick="closeModal()">✕</button>
        </div>

        <p class="muted" style="margin-top:0">Checkout as a guest. No account is required. Enter your contact and delivery details to continue to secure payment.</p>

        <form class="form-grid" onsubmit="submitDemoOrder(event)">
          <label>
            Full name
            <input id="coName" name="name" autocomplete="name" required value="${escapeHtml(user?.name || '')}">
          </label>

          <label>
            Email
            <input id="coEmail" name="email" type="email" autocomplete="email" required value="${escapeHtml(user?.email || '')}">
          </label>

          <label>
            Mobile number
            <input id="coPhone" name="tel" type="tel" autocomplete="tel" required placeholder="+1 555 123 4567 / +44 7700 900123">
          </label>

          <label>
            Address
            <input id="coAddress" name="street-address" autocomplete="street-address" required placeholder="Street address">
          </label>

          <label>
            City
            <input id="coCity" name="address-level2" autocomplete="address-level2" required placeholder="City">
          </label>

          <label>
            State / Province / Region
            <input id="coState" name="address-level1" autocomplete="address-level1" required placeholder="State / Province / Region">
          </label>

          <label>
            ZIP / Postal code
            <input id="coZip" name="postal-code" autocomplete="postal-code" required placeholder="ZIP / Postal code">
          </label>

          <label>
            Country
            <select id="coCountry" name="country" autocomplete="country-name" required>
              <option value="United States" ${c.country === 'US' ? 'selected' : ''}>United States</option>
              <option value="Canada" ${c.country === 'CA' ? 'selected' : ''}>Canada</option>
              <option value="United Kingdom" ${c.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
            </select>
          </label>

          <div class="note-box">You will be charged in AZN. Secure payment by Epoint.</div>
          <button class="primary-button full" type="submit">Continue to secure payment</button>
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

  const form = e.currentTarget;
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton?.disabled) return;

  const checkoutItems = (pendingCheckoutItems?.length ? pendingCheckoutItems : state.cart)
    .map(item => ({ id: Number(item.id), qty: Number(item.qty), variant: item.variant ?? null }));

  if (!checkoutItems.length) {
    showToast('Your cart is empty');
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Preparing secure payment…';
  }

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: $('coName').value.trim(),
        email: $('coEmail').value.trim(),
        phone: $('coPhone').value.trim(),
        address: $('coAddress').value.trim(),
        city: $('coCity').value.trim(),
        state: $('coState').value.trim(),
        zip: $('coZip').value.trim(),
        country: $('coCountry').value,
        items: checkoutItems
      })
    });

    const d = await r.json();
    if (!r.ok) {
      showToast(d.error || 'Please check your details and try again.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    if (!d.order?.id || !d.checkoutToken) {
      console.error('Order response did not include secure checkout credentials.');
      showToast('Order was created, but secure payment could not be started. Contact support with your order number.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    const paymentResponse = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId: d.order.id, checkoutToken: d.checkoutToken })
    });

    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || !payment.redirect_url) {
      console.error('Payment creation failed for order:', d.order.id, payment.error || 'No redirect URL');
      showToast(payment.error || `Order ${d.order.id} was saved, but payment could not be started.`);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      return;
    }

    window.location.href = payment.redirect_url;
  } catch (error) {
    console.error('CHECKOUT ERROR:', error);
    showToast('Unable to continue to payment. Please try again.');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Continue to secure payment';
    }
  }
}

    async function trackOrder() { const code = $('trackInput').value.trim().toUpperCase(); if (!code) { $('trackingResult').innerHTML = '<p class="muted">Enter an order number.</p>'; return; } const r = await fetch('/api/orders/track/' + encodeURIComponent(code)); const d = await r.json(); if (!r.ok) { $('trackingResult').innerHTML = '<p class="muted">Order not found.</p>'; return; } const order = d.order; $('trackingResult').innerHTML = `<div class="tracking-result"><div class="tracking-meta"><div><strong>Order ${escapeHtml(order.id)}</strong><div class="muted">Created ${new Date(order.createdAt).toLocaleString()}</div></div><div class="tracking-status">${escapeHtml(order.status)}</div></div><div class="timeline"><div class="step done"><div class="dot"></div><div><strong>Order placed</strong><br><small>Order received</small></div></div><div class="step done"><div class="dot"></div><div><strong>Processing</strong><br><small>Preparing your order</small></div></div><div class="step ${order.status === 'Shipped' || order.status === 'In transit' || order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>Shipped</strong><br><small>Tracking number assigned</small></div></div><div class="step ${order.status === 'In transit' || order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>In transit</strong><br><small>Package moving through carrier network</small></div></div><div class="step ${order.status === 'Delivered' ? 'done' : ''}"><div class="dot"></div><div><strong>Delivered</strong><br><small>Final carrier scan</small></div></div></div></div>`; }
    function showPolicy(type) {
  const copy = {
    shipping: {
      title: 'Shipping Policy',
      html: `
        <h3>Shipping destinations</h3>
        <p>DreamGrind currently accepts orders for customers in the United States, Canada and the United Kingdom.</p>

        <h3>Shipping cost</h3>
        <p>Shipping is currently free for customers.</p>

        <h3>Processing time</h3>
        <p>Orders are normally processed after successful payment confirmation. Processing and delivery times may vary depending on the destination, product availability and carrier.</p>

        <h3>Tracking</h3>
        <p>When tracking information is available, it may be provided to the customer after the order has been dispatched.</p>

        <h3>Delivery delays</h3>
        <p>DreamGrind is not responsible for delays caused by carriers, customs procedures, weather or other circumstances outside our reasonable control.</p>
      `
    },

    returns: {
      title: 'Returns & Refunds',
      html: `
        <h3>Return requests</h3>
        <p>Customers should contact DreamGrind before returning an item so that return instructions can be provided.</p>

        <h3>Damaged or incorrect items</h3>
        <p>If an item arrives damaged, defective or different from the item ordered, please contact customer support with the order number and relevant details as soon as possible.</p>

        <h3>Refunds</h3>
        <p>Approved refunds are processed after the return or issue has been reviewed. The time required for the refund to appear in the customer's account may depend on the payment provider or bank.</p>

        <h3>Exclusions</h3>
        <p>Items that have been used, damaged after delivery or returned without following the provided return instructions may not qualify for a refund.</p>
      `
    },

    privacy: {
      title: 'Privacy Policy',
      html: `
        <h3>1. Information we collect</h3>
        <p>DreamGrind may collect information that customers provide when creating an account, placing an order or contacting customer support. This may include name, email address, phone number, delivery address, city, country and order information.</p>

        <h3>2. How we use information</h3>
        <p>We use customer information to create and manage accounts, process orders, arrange delivery, provide order tracking, respond to customer requests, maintain website security and comply with applicable legal obligations.</p>

        <h3>3. Payments</h3>
        <p>Online payments are processed through our payment provider, Epoint. DreamGrind does not intentionally store customers' full payment card details on its own website servers.</p>

        <h3>4. Service providers</h3>
        <p>We may use trusted third-party service providers for payment processing, website hosting, database infrastructure, delivery and other services necessary to operate the store.</p>

        <h3>5. Cookies and local storage</h3>
        <p>The website may use essential cookies and browser local storage to support account sessions, shopping cart preferences, country selection and language preferences.</p>

        <h3>6. Data retention</h3>
        <p>Customer information is retained for as long as reasonably necessary to provide services, maintain business records, resolve disputes, prevent fraud and meet applicable legal requirements.</p>

        <h3>7. Data security</h3>
        <p>DreamGrind takes reasonable technical and organisational measures to protect customer information against unauthorised access, alteration or disclosure.</p>

        <h3>8. Contact</h3>
        <p>Customers may contact DreamGrind through the Contact Us section of the website regarding privacy or personal information questions.</p>
      `
    },

    terms: {
      title: 'Terms & Conditions',
      html: `
        <h3>1. Website use</h3>
        <p>By using the DreamGrind website, you agree to use the website lawfully and not to misuse its services or attempt to interfere with its operation.</p>

        <h3>2. Products and prices</h3>
        <p>Product availability, descriptions and prices may change without prior notice. We aim to keep product information accurate, but occasional errors may occur.</p>

        <h3>3. Orders</h3>
        <p>An order is submitted when the customer completes checkout. An order becomes a confirmed paid order only after successful payment confirmation.</p>

        <h3>4. Payment</h3>
        <p>Payments are processed securely through Epoint. Orders may be cancelled or not completed when payment is declined, cancelled or otherwise unsuccessful.</p>

        <h3>5. Shipping</h3>
        <p>Delivery times may vary depending on destination, product availability, customs procedures and carrier performance.</p>

        <h3>6. Returns and refunds</h3>
        <p>Returns and refunds are handled according to the DreamGrind Returns & Refunds Policy.</p>

        <h3>7. Changes to these terms</h3>
        <p>DreamGrind may update these terms when necessary. The current version published on the website will apply to future use of the website.</p>
      `
    },

    cookies: {
      title: 'Cookies & Local Storage',
      html: `
        <h3>How we use cookies and local storage</h3>
        <p>DreamGrind uses essential browser storage technologies to support website functionality, including account sessions, shopping cart preferences, country selection and language preferences.</p>

        <h3>Third-party services</h3>
        <p>Some services used by the website, such as payment processing or hosting infrastructure, may use their own technical cookies or similar technologies where necessary to provide their services.</p>
      `
    }
  };

  const selected = copy[type] || copy.privacy;

  $('modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-head">
          <h2>${selected.title}</h2>
          <button class="close-btn" onclick="closeModal()">✕</button>
        </div>
        <div class="policy-copy">
          ${selected.html}
        </div>
      </div>
    </div>
  `;
}
    async function subscribe(e) { e.preventDefault(); const email = $('newsletterEmail').value.trim(); const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) { showToast(d.error || 'Unable to subscribe'); return; } $('newsletterEmail').value = ''; showToast('Subscribed'); }
    function closeModal(e) { if (e && e.target !== e.currentTarget) return; $('modalRoot').innerHTML = ''; }
   const paymentParams = new URLSearchParams(window.location.search);
const paymentStatus = paymentParams.get('payment');
const returnedOrderId = paymentParams.get('order_id');

if (paymentStatus === 'success') {
  const checkoutMode = sessionStorage.getItem('dg_checkout_mode') || 'cart';
  if (checkoutMode !== 'buy-now') {
    state.cart = [];
    saveAll();
  }
  sessionStorage.removeItem('dg_checkout_mode');
  window.history.replaceState({}, '', '/');
  showToast(returnedOrderId
    ? `Payment successful. Order ${returnedOrderId}. Thank you!`
    : 'Payment successful. Thank you for your order!');
}

if (paymentStatus === 'error') {
  sessionStorage.removeItem('dg_checkout_mode');
  window.history.replaceState({}, '', '/');
  showToast(returnedOrderId
    ? `Payment was not completed for ${returnedOrderId}. Your cart is still saved.`
    : 'Payment was not completed. Your cart is still saved.');
}
    window.addEventListener('popstate', () => {
      const productId = new URLSearchParams(window.location.search).get('product');
      if (productId) {
        renderProductPage(productId);
      } else if (productPageOpen) {
        dismissProductPage(false);
      }
    });

    syncCountryPicker();
    saveAll();
    loadProducts();
    initLanguage();
