/* DreamGrind Growth experience. Keeps the existing storefront and checkout as the source of truth. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  // Safe fallback for the store state consumed by optional growth widgets.
  const state = window.state || (window.state = { category: 'All', wishlist: new Set(), cart: [] });
  const RECENT_KEY = 'dg_recent_products_v1';
  let recoveryTimer = null;
  let lastProductPanelId = null;
  let lastProductListSignature = '';
  let baseDescription = '';
  let baseOgTitle = '';
  let baseOgDescription = '';
  let baseOgImage = '';
  let baseCanonical = '';

  const lang = () => localStorage.getItem('dg_language') === 'az' ? 'az' : 'en';
  const az = () => lang() === 'az';
  const storeProducts = () => (typeof products !== 'undefined' && Array.isArray(products)) ? products : [];
  const market = () => (typeof currencyConfig === 'function' ? currencyConfig() : { country: 'US', currency: 'USD' });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const available = product => typeof isProductAvailableInCountry === 'function' ? isProductAvailableInCountry(product) : true;
  const hasOptions = product => (Array.isArray(product?.variantCombinations) && product.variantCombinations.length > 0) || (Array.isArray(product?.variants) && product.variants.length > 0);
  const productPrice = product => typeof productPriceForCountry === 'function' ? Number(productPriceForCountry(product)) : Number(product?.price || 0);
  const productStartingPrice = product => {
    const options = typeof productVariantCombinations === 'function' ? productVariantCombinations(product) : [];
    const prices = options.map(option => Number(variantPriceForCountry(product, option))).filter(value => Number.isFinite(value) && value > 0);
    return prices.length ? Math.min(...prices) : productPrice(product);
  };
  const moneyLabel = amount => typeof money === 'function' ? money(amount, market().currency) : `${Number(amount).toFixed(2)} ${market().currency}`;

  function translate(en, azText) { return az() ? azText : en; }

  function readRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').map(Number).filter(Number.isFinite); }
    catch (_) { return []; }
  }

  function recordViewed(id) {
    const numeric = Number(id);
    if (!Number.isInteger(numeric) || numeric <= 0) return;
    const next = [numeric, ...readRecent().filter(item => item !== numeric)].slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (_) {}
    renderRecent();
  }

  function cards(items) {
    if (!items.length) return `<p class="dg-finder-empty">${translate('No products are currently available in this market.', 'Bu bazarda hazırda mövcud məhsul yoxdur.')}</p>`;
    return items.map(item => typeof cardHtml === 'function' ? cardHtml(item) : '').join('');
  }

  function getDiscoveryProducts() {
    const list = storeProducts().filter(available);
    return list.sort((a, b) => {
      const soldDiff = (Number(b.unitsSold) || 0) - (Number(a.unitsSold) || 0);
      if (soldDiff) return soldDiff;
      const dateDiff = Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
      if (Number.isFinite(dateDiff) && dateDiff) return dateDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    }).slice(0, 4);
  }

  function renderDiscover() {
    const target = $('dgDiscoverGrid');
    if (!target) return;
    target.innerHTML = cards(getDiscoveryProducts());
  }

  function renderFinderControls() {
    const category = $('dgFinderCategory');
    const budget = $('dgFinderBudget');
    const keyword = $('dgFinderKeyword');
    const button = $('dgRunFinder');
    if (!category || !budget || !keyword || !button) return;
    const selected = category.value || 'All';
    const values = [...new Set(storeProducts().map(p => String(p.category || 'General')).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    category.innerHTML = `<option value="All">${translate('All categories', 'Bütün kateqoriyalar')}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    category.value = values.includes(selected) ? selected : 'All';
    const budgetValue = budget.value || '0';
    budget.innerHTML = [0, 25, 50, 100, 200].map(value => `<option value="${value}">${value === 0 ? translate('Any budget', 'İstənilən büdcə') : `${translate('Up to', 'Maksimum')} ${moneyLabel(value)}`}</option>`).join('');
    budget.value = ['0', '25', '50', '100', '200'].includes(budgetValue) ? budgetValue : '0';
    keyword.placeholder = translate('e.g. pet, home, travel', 'məsələn: pet, ev, səyahət');
    button.textContent = translate('Find products', 'Məhsul tap');
  }

  function runFinder() {
    const category = $('dgFinderCategory')?.value || 'All';
    const budget = Number($('dgFinderBudget')?.value || 0);
    const query = String($('dgFinderKeyword')?.value || '').trim().toLocaleLowerCase();
    const results = storeProducts().filter(product => {
      if (!available(product)) return false;
      if (category !== 'All' && String(product.category || 'General') !== category) return false;
      const price = productStartingPrice(product);
      if (budget > 0 && price > budget) return false;
      if (query && !`${product.title || ''} ${product.category || ''} ${product.description || ''}`.toLocaleLowerCase().includes(query)) return false;
      return price > 0;
    }).sort((a, b) => productStartingPrice(a) - productStartingPrice(b)).slice(0, 8);
    const target = $('dgFinderResults');
    if (!target) return;
    target.innerHTML = results.length
      ? `<div class="product-grid">${cards(results)}</div>`
      : `<p class="dg-finder-empty">${translate('No matching products were found. Try another category or a higher budget.', 'Uyğun məhsul tapılmadı. Başqa kateqoriya və ya daha yüksək büdcə seçin.')}</p>`;
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    const digitCount = (query.match(/\d/g) || []).length;
    const safeTerm = query && !looksLikeEmail && digitCount < 7 ? query.slice(0, 80) : '';
    const safeCategory = category !== 'All' ? category : '';
    if (safeTerm || safeCategory) window.DGAnalytics?.track('search', { search_term: safeTerm || safeCategory, currency: market().currency, value: budget || undefined });
  }

  function renderRecent() {
    const section = $('dg-recent-section');
    const target = $('dgRecentGrid');
    if (!section || !target) return;
    const recentIds = readRecent();
    const list = recentIds.map(id => storeProducts().find(product => Number(product.id) === id)).filter(product => product && available(product));
    section.hidden = !list.length;
    target.innerHTML = list.length ? cards(list) : '';
  }

  function renderFaq() {
    const target = $('dgFaqList');
    if (!target) return;
    const entries = az() ? [
      ['Çatdırılma nə qədər vaxt aparır?', 'Müddət məhsula, ölkəyə və təsdiqlənmiş logistika marşrutuna görə dəyişir. Dəqiq müddət məhsul səhifəsində göstərilmirsə, sifarişdən əvvəl dəstəyə yazın.'],
      ['Gömrük rüsumları qiymətə daxildirmi?', 'Yalnız konkret məhsul təklifində açıq şəkildə daxil olduğu təsdiqlənən rüsum və vergilər qiymətə daxildir. DreamGrind bütün sifarişlər üçün DDP və ya vergilərin əvvəlcədən ödənildiyi çatdırılma vədi vermir.'],
      ['Hansı ödəniş üsulundan istifadə olunur?', 'Saytdakı ödəniş Epoint vasitəsilə təhlükəsiz şəkildə tamamlanır. Kart məlumatları DreamGrind serverində saxlanılmır.'],
      ['Sifarişimi necə izləyə bilərəm?', 'Sifariş nömrənizi “Track your order” bölməsinə daxil edin. Daşıyıcı izləmə nömrəsi əlavə edildikdən sonra həmin səhifədə görünəcək.'],
      ['Məhsula necə rəy yaza bilərəm?', 'Yalnız ödənişi təsdiqlənmiş sifarişdə həmin məhsulu alan müştəri sifariş nömrəsi və checkout e-poçtu ilə təsdiqlənmiş rəy göndərə bilər.']
    ] : [
      ['How long does delivery take?', 'Delivery time varies by product, destination and the confirmed fulfilment route. If an estimate is not shown on the product page, contact support before ordering.'],
      ['Are customs duties included in the price?', 'Only duties and taxes explicitly confirmed as included in that exact product offer are covered. DreamGrind does not promise DDP or prepaid taxes for every order.'],
      ['How do I pay?', 'Payments are completed securely through Epoint on the website. DreamGrind does not store full payment card details on its servers.'],
      ['How can I track my order?', 'Enter your order number in the Track your order section. Carrier tracking details appear there after our team adds the tracking number.'],
      ['Can I leave a product review?', 'Only a customer with a paid order containing that product can submit a verified review using the order number and checkout email.']
    ];
    target.innerHTML = entries.map(([question, answer]) => `<details class="dg-faq-item"><summary>${esc(question)}</summary><div class="dg-faq-answer">${esc(answer)}</div></details>`).join('');
  }

  function renderTools() {
    renderDiscover();
    renderFinderControls();
    renderRecent();
    renderFaq();
  }

  function countCartItems() {
    try { return (state.cart || []).reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0); }
    catch (_) { return 0; }
  }

  function analyticsItems(items) {
    return (Array.isArray(items) ? items : []).map(item => {
      const product = storeProducts().find(p => Number(p.id) === Number(item.id));
      if (!product) return null;
      const combination = (item.variantColor != null || item.variantSize != null) && typeof findVariantCombination === 'function'
        ? findVariantCombination(product, item.variantColor, item.variantSize) : null;
      const price = combination && typeof variantPriceForCountry === 'function' ? variantPriceForCountry(product, combination) : productPrice(product);
      return { item_id: String(product.id), item_name: String(product.title || '').slice(0, 100), item_category: String(product.category || 'General').slice(0, 80), price: Number(price.toFixed(2)), quantity: Math.max(1, Number(item.qty) || 1) };
    }).filter(Boolean);
  }

  function trackCartAdd(items) {
    const lines = analyticsItems(items);
    if (!lines.length) return;
    window.DGAnalytics?.track('add_to_cart', { currency: market().currency, value: Number(lines.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)), items: lines });
  }

  function installAnalyticsHooks() {
    for (const functionName of ['quickAdd', 'addProductFromDetail']) {
      const original = window[functionName];
      if (typeof original !== 'function' || original.__dgWrapped) continue;
      const wrapped = function (id) {
        const before = countCartItems();
        const product = storeProducts().find(item => Number(item.id) === Number(id));
        const result = original.apply(this, arguments);
        const after = countCartItems();
        if (product && after > before) {
          const qty = Math.max(1, after - before);
          trackCartAdd([{ id: product.id, qty }]);
        }
        return result;
      };
      wrapped.__dgWrapped = true;
      window[functionName] = wrapped;
    }

    const originalOpenCart = window.openCart;
    if (typeof originalOpenCart === 'function' && !originalOpenCart.__dgWrapped) {
      const wrapped = function () {
        const result = originalOpenCart.apply(this, arguments);
        const lines = analyticsItems(state.cart || []);
        if (lines.length) window.DGAnalytics?.track('view_cart', { currency: market().currency, value: Number(lines.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)), items: lines });
        return result;
      };
      wrapped.__dgWrapped = true;
      window.openCart = wrapped;
    }

    const originalWishlist = window.toggleWishlist;
    if (typeof originalWishlist === 'function' && !originalWishlist.__dgWrapped) {
      const wrapped = function (id) {
        const product = storeProducts().find(item => Number(item.id) === Number(id));
        const wasAdded = product && !state.wishlist.has(product.id);
        const result = originalWishlist.apply(this, arguments);
        if (wasAdded && product) window.DGAnalytics?.track('add_to_wishlist', { currency: market().currency, value: productPrice(product), items: analyticsItems([{ id: product.id, qty: 1 }]) });
        return result;
      };
      wrapped.__dgWrapped = true;
      window.toggleWishlist = wrapped;
    }

  }

  function observeProductGrid() {
    const grid = $('productGrid');
    if (!grid || grid.dataset.dgObserved === 'true') return;
    grid.dataset.dgObserved = 'true';
    const update = () => {
      renderDiscover();
      const current = storeProducts().filter(available).slice(0, 12);
      const signature = `${state.category || 'All'}:${market().country}:${current.map(p => p.id).join(',')}`;
      if (signature && signature !== lastProductListSignature) {
        lastProductListSignature = signature;
        const lines = analyticsItems(current.map(p => ({ id: p.id, qty: 1 })));
        if (lines.length) window.DGAnalytics?.track('view_item_list', { item_list_name: state.category === 'All' ? 'Store catalogue' : `${state.category} category`, items: lines });
      }
    };
    const observer = new MutationObserver(update);
    observer.observe(grid, { childList: true, subtree: true });
    update();
  }

  function setMeta(selector, attribute, value) {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (selector.startsWith('meta[property=')) element.setAttribute('property', selector.match(/property="([^"]+)/)?.[1] || '');
      else element.setAttribute('name', selector.match(/name="([^"]+)/)?.[1] || '');
      document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
  }

  function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
  }

  function injectSiteSchema() {
    if ($('dgSiteSchema')) return;
    const script = document.createElement('script');
    script.id = 'dgSiteSchema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: 'DreamGrind',
      url: String(baseCanonical || `${window.location.origin}/`).replace(/\/+$/, ''),
      email: 'dreamgrindstore@gmail.com',
      areaServed: ['United States', 'Canada', 'United Kingdom', 'Azerbaijan']
    }).replace(/</g, '\\u003c');
    document.head.appendChild(script);
  }

  function updateProductSeo(product, reviews = []) {
    if (!product) return;
    const title = `${product.title} | DreamGrind`;
    const description = String(product.description || `Explore ${product.title} at DreamGrind.`).replace(/\s+/g, ' ').trim().slice(0, 155);
    const publicBase = String(baseCanonical || `${window.location.origin}/`).replace(/\/+$/, '');
    const url = `${publicBase}/?product=${encodeURIComponent(product.id)}&country=${market().country}`;
    const image = (Array.isArray(product.images) ? product.images[0] : '') || product.image || '';
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    if (/^https?:\/\//i.test(image)) setMeta('meta[property="og:image"]', 'content', image);
    setCanonical(url);

    const variantPrices = typeof productVariantCombinations === 'function'
      ? productVariantCombinations(product).map(variant => Number(variantPriceForCountry(product, variant))).filter(value => Number.isFinite(value) && value > 0)
      : [];
    const offers = variantPrices.length
      ? { '@type': 'AggregateOffer', priceCurrency: market().currency, lowPrice: Math.min(...variantPrices).toFixed(2), highPrice: Math.max(...variantPrices).toFixed(2), offerCount: variantPrices.length, url }
      : { '@type': 'Offer', priceCurrency: market().currency, price: Number(productPrice(product)).toFixed(2), url };
    const schema = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: String(product.title || '').slice(0, 160),
      description,
      image: (Array.isArray(product.images) ? product.images : []).concat(image || []).filter(item => /^https?:\/\//i.test(String(item || ''))).slice(0, 8),
      url,
      offers
    };
    if (String(product.brand || '').trim()) schema.brand = { '@type': 'Brand', name: String(product.brand).trim().slice(0, 100) };
    if (product.gtin) schema.gtin = String(product.gtin);
    if (product.mpn) schema.mpn = String(product.mpn).slice(0, 100);
    if (reviews.length) {
      const average = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
      schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(average.toFixed(1)), reviewCount: reviews.length };
    }
    let ld = $('dgProductSchema');
    if (!ld) { ld = document.createElement('script'); ld.id = 'dgProductSchema'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
  }

  function restoreHomeSeo() {
    document.getElementById('dgProductSchema')?.remove();
    document.title = translate('DreamGrind — Smart Shopping Starts Here', 'DreamGrind — Ağıllı alış-veriş burada başlayır');
    setMeta('meta[name="description"]', 'content', baseDescription);
    setMeta('meta[property="og:title"]', 'content', baseOgTitle);
    setMeta('meta[property="og:description"]', 'content', baseOgDescription);
    if (baseOgImage) setMeta('meta[property="og:image"]', 'content', baseOgImage);
    setMeta('meta[property="og:url"]', 'content', baseCanonical || `${window.location.origin}/`);
    setCanonical(baseCanonical || `${window.location.origin}/`);
  }

  function renderProductReviews(productId, reviews) {
    const list = $('dgReviewList');
    const heading = $('dgReviewHeading');
    if (!list || !heading) return;
    heading.textContent = translate(`Customer reviews (${reviews.length})`, `Müştəri rəyləri (${reviews.length})`);
    if (!reviews.length) {
      list.innerHTML = `<p class="dg-finder-empty">${translate('No verified reviews yet. Purchased this product? Submit a review below using your paid order details.', 'Hələ təsdiqlənmiş rəy yoxdur. Məhsulu almısınızsa, ödənişli sifariş məlumatlarınızla aşağıda rəy göndərin.')}</p>`;
      return;
    }
    list.innerHTML = reviews.map(review => `<article class="dg-review-card"><div class="dg-review-top"><span class="dg-review-stars" aria-label="${Number(review.rating)} out of 5">${'★'.repeat(Number(review.rating) || 0)}${'☆'.repeat(5 - (Number(review.rating) || 0))}</span><span class="dg-verified">✓ ${translate('Verified purchase', 'Təsdiqlənmiş alış')}</span></div>${review.title ? `<h3>${esc(review.title)}</h3>` : ''}<p>${esc(review.text)}</p><div class="dg-review-meta"><span>${esc(review.customerName || 'Customer')}</span><span>${new Date(review.createdAt).toLocaleDateString()}</span></div></article>`).join('');
  }

  function updateProductRating(product, reviews) {
    const host = document.querySelector('#modalRoot .product-page-info');
    const heading = host?.querySelector('.product-page-title');
    if (!host || !heading) return;
    let rating = host.querySelector('.product-rating');
    if (!reviews.length) { rating?.remove(); return; }
    const average = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
    const markup = `★ ${average.toFixed(1)} <span class="product-page-reviews">· ${reviews.length} reviews</span>`;
    if (!rating) {
      rating = document.createElement('div');
      rating.className = 'product-rating';
      heading.insertAdjacentElement('afterend', rating);
    }
    rating.setAttribute('aria-label', `Rated ${average.toFixed(1)} out of 5`);
    rating.innerHTML = markup;
    product.rating = Number(average.toFixed(1));
    product.reviews = reviews.length;
  }

  async function loadProductReviews(product) {
    try {
      const response = await fetch(`/api/reviews/${encodeURIComponent(product.id)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reviews unavailable');
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];
      renderProductReviews(product.id, reviews);
      updateProductRating(product, reviews);
      updateProductSeo(product, reviews);
    } catch (error) {
      console.warn('DreamGrind reviews could not be loaded.', error);
      renderProductReviews(product.id, []);
      updateProductRating(product, []);
      updateProductSeo(product, []);
    }
  }

  function renderProductExtras(product) {
    const host = document.querySelector('#modalRoot .product-page-info');
    if (!host || !product) return;
    if (host.querySelector('[data-dg-product-extras]') && lastProductPanelId === String(product.id)) return;
    host.querySelector('[data-dg-product-extras]')?.remove();
    lastProductPanelId = String(product.id);
    window.DGAnalytics?.track('view_item', { currency: market().currency, value: productPrice(product), items: analyticsItems([{ id: product.id, qty: 1 }]) });

    const suggestions = storeProducts().filter(item => Number(item.id) !== Number(product.id) && available(item))
      .sort((a, b) => {
        const categoryA = String(a.category || '') === String(product.category || '') ? 0 : 1;
        const categoryB = String(b.category || '') === String(product.category || '') ? 0 : 1;
        return categoryA - categoryB || (Number(b.unitsSold) || 0) - (Number(a.unitsSold) || 0);
      }).slice(0, 2);
    const canBundle = !hasOptions(product) && suggestions.length > 0 && suggestions.every(item => !hasOptions(item));

    const extras = document.createElement('section');
    extras.className = 'dg-product-extras';
    extras.dataset.dgProductExtras = 'true';
    extras.innerHTML = `
      <section aria-labelledby="dgPairHeading">
        <h2 id="dgPairHeading">${translate('Pair it with', 'Bununla birlikdə baxın')}</h2>
        <p class="muted">${translate('Explore complementary finds. Product prices remain separate; no bundle discount is applied.', 'Uyğun məhsullara baxın. Qiymətlər ayrıdır, avtomatik bundle endirimi tətbiq edilmir.')}</p>
        ${suggestions.length ? `<div class="product-grid dg-pair-grid">${cards(suggestions)}</div>${canBundle ? suggestions.map(item => `<button class="secondary-button" type="button" style="margin:8px 8px 0 0" onclick="window.dgAddBundle(${Number(product.id)},${Number(item.id)})">${translate('Add both to cart', 'Hər ikisini səbətə əlavə et')}</button>`).join('') : ''}` : `<p class="dg-finder-empty">${translate('More matching products will appear as the catalogue grows.', 'Kataloq böyüdükcə uyğun məhsullar burada görünəcək.')}</p>`}
      </section>
      <section style="margin-top:28px" aria-labelledby="dgReviewHeading">
        <h2 id="dgReviewHeading">${translate('Customer reviews', 'Müştəri rəyləri')}</h2>
        <p class="muted">${translate('Only reviews matched to a paid order are displayed as verified purchases.', 'Yalnız ödənişli sifarişlə uyğunlaşdırılmış rəylər təsdiqlənmiş alış kimi göstərilir.')}</p>
        <div id="dgReviewList" class="dg-review-list"><p class="muted">${translate('Loading reviews…', 'Rəylər yüklənir…')}</p></div>
        <form id="dgReviewForm" class="dg-review-form">
          <h3>${translate('Share your experience', 'Təcrübənizi paylaşın')}</h3>
          <p>${translate('Your order number and checkout email are checked against a paid order before the review is published. Only your first name and review are shown publicly; your email and order number are not displayed.', 'Rəy dərc edilməzdən əvvəl sifariş nömrəsi və checkout e-poçtu ödənişli sifarişlə yoxlanılır. İctimai olaraq yalnız adınızın ilk hissəsi və rəyiniz göstərilir; e-poçt və sifariş nömrəniz yayımlanmır.')}</p>
          <label>${translate('Order number', 'Sifariş nömrəsi')}<input name="orderId" required maxlength="40" autocomplete="off" placeholder="DG…"></label>
          <label>${translate('Checkout email', 'Checkout e-poçtu')}<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
          <label>${translate('Rating', 'Qiymət')}<select name="rating" required><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Bad</option></select></label>
          <label>${translate('Review title (optional)', 'Rəy başlığı (istəyə bağlı)')}<input name="title" maxlength="100"></label>
          <label class="dg-review-form-full">${translate('Your review', 'Rəyiniz')}<textarea name="text" minlength="10" maxlength="1500" required></textarea></label>
          <button class="primary-button" type="submit">${translate('Submit verified review', 'Təsdiqlənmiş rəyi göndər')}</button>
          <span id="dgReviewStatus" class="dg-recovery-status" role="status"></span>
        </form>
      </section>`;
    host.appendChild(extras);
    $('dgReviewForm')?.addEventListener('submit', submitReview);
    loadProductReviews(product);
  }

  async function submitReview(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const status = $('dgReviewStatus');
    if (button) { button.disabled = true; button.textContent = translate('Checking purchase…', 'Alış yoxlanılır…'); }
    const currentId = Number(new URLSearchParams(window.location.search).get('product'));
    const formData = new FormData(form);
    const payload = {
      productId: currentId,
      orderId: String(formData.get('orderId') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      rating: Number(formData.get('rating')),
      title: String(formData.get('title') || '').trim(),
      text: String(formData.get('text') || '').trim()
    };
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit review.');
      status.textContent = translate('Thank you. Your verified review is now published.', 'Təşəkkür edirik. Təsdiqlənmiş rəyiniz dərc olundu.');
      form.reset();
      const product = storeProducts().find(item => Number(item.id) === currentId);
      if (product) await loadProductReviews(product);
      window.DGAnalytics?.track('submit_review', { product_id: String(currentId), rating: payload.rating });
    } catch (error) {
      status.textContent = error.message;
    } finally {
      if (button) { button.disabled = false; button.textContent = translate('Submit verified review', 'Təsdiqlənmiş rəyi göndər'); }
    }
  }

  window.dgAddBundle = function (baseId, pairId) {
    const ids = [Number(baseId), Number(pairId)];
    const selected = ids.map(id => storeProducts().find(product => Number(product.id) === id));
    if (selected.some(product => !product || !available(product) || hasOptions(product))) {
      window.showToast?.(translate('Please choose product options on the product page first.', 'Əvvəlcə məhsul səhifəsində seçimləri edin.'));
      return;
    }
    for (const product of selected) {
      const existing = state.cart.find(item => Number(item.id) === Number(product.id) && !item.variant && !item.variantColor && !item.variantSize);
      if (existing) existing.qty += 1;
      else state.cart.push({ id: Number(product.id), qty: 1, variant: null, variantColor: null, variantSize: null });
    }
    saveAll();
    trackCartAdd(ids.map(id => ({ id, qty: 1 })));
    window.showToast?.(translate('Both products added to your cart.', 'Hər iki məhsul səbətə əlavə edildi.'));
    window.openCart?.();
  };

  function installProductObserver() {
    const root = $('modalRoot');
    if (!root || root.dataset.dgObserved === 'true') return;
    root.dataset.dgObserved = 'true';
    const observer = new MutationObserver(() => {
      const overlay = root.querySelector('.product-page-overlay');
      if (!overlay) {
        if (lastProductPanelId) { lastProductPanelId = null; restoreHomeSeo(); }
        return;
      }
      const id = Number(new URLSearchParams(window.location.search).get('product'));
      const product = storeProducts().find(item => Number(item.id) === id);
      if (!product) return;
      recordViewed(id);
      renderProductExtras(product);
      updateProductSeo(product, []);
    });
    observer.observe(root, { childList: true, subtree: true });
    const existingOverlay = root.querySelector('.product-page-overlay');
    if (existingOverlay) {
      const id = Number(new URLSearchParams(window.location.search).get('product'));
      const product = storeProducts().find(item => Number(item.id) === id);
      if (product) { recordViewed(id); renderProductExtras(product); updateProductSeo(product, []); }
    }
  }

  async function getGrowthConfig() {
    try {
      const response = await fetch('/api/store-config', { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) { return null; }
  }

  function attachRecoveryConsent(root, enabled) {
    if (!enabled) return;
    const email = root.querySelector('#coEmail');
    const form = email?.closest('form');
    if (!email || !form || form.querySelector('#dgCartRecoveryConsent')) return;
    const label = document.createElement('label');
    label.className = 'dg-recovery-optin';
    label.innerHTML = `<input id="dgCartRecoveryConsent" type="checkbox"><span>${translate('Email me one reminder about this unfinished checkout after 2 hours.', 'Yarımçıq qalan checkout barədə 2 saat sonra bir e-poçt xatırlatması göndərin.')}<small>${translate('Optional. You can unsubscribe from reminders in the email. This does not subscribe you to marketing emails.', 'İstəyə bağlıdır. E-poçtdakı keçidlə xatırlatmalardan imtina edə bilərsiniz. Bu, sizi reklam e-poçtlarına abunə etmir.')}</small></span>`;
    const status = document.createElement('span');
    status.id = 'dgCartRecoveryStatus';
    status.className = 'dg-recovery-status';
    (email.closest('label') || email).insertAdjacentElement('afterend', label);
    label.insertAdjacentElement('afterend', status);

    let cancelToken = '';
    let cancelEmail = '';
    let recoveryRequestVersion = 0;
    const cancelReminder = async () => {
      if (!cancelToken || !cancelEmail) return;
      const token = cancelToken;
      const address = cancelEmail;
      cancelToken = '';
      cancelEmail = '';
      try {
        await fetch('/api/cart-recovery/cancel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: address, token })
        });
      } catch (error) { console.warn('DreamGrind reminder preference could not be cancelled.', error); }
    };
    const capture = async (requestVersion) => {
      const consent = $('dgCartRecoveryConsent');
      if (!consent?.checked) { await cancelReminder(); return; }
      const value = String(email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        status.textContent = translate('Enter your email first to enable this reminder.', 'Xatırlatma üçün əvvəlcə e-poçtunuzu daxil edin.');
        return;
      }
      const currentItems = (Array.isArray(pendingCheckoutItems) && pendingCheckoutItems.length ? pendingCheckoutItems : (state.cart || []))
        .map(item => ({ id: Number(item.id), qty: Math.max(1, Math.min(20, Number(item.qty) || 1)), variantColor: item.variantColor ?? null, variantSize: item.variantSize ?? null }))
        .filter(item => Number.isInteger(item.id) && item.id > 0);
      if (!currentItems.length) return;
      const country = $('coCountry')?.value || 'United States';
      const signature = JSON.stringify([value.toLowerCase(), country, currentItems]);
      if (consent.dataset.lastSignature === signature) return;
      if (cancelToken && cancelEmail.toLowerCase() !== value.toLowerCase()) await cancelReminder();
      status.textContent = translate('Saving your reminder preference…', 'Xatırlatma seçiminiz yadda saxlanılır…');
      try {
        const response = await fetch('/api/cart-recovery', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ email: value, consent: true, country, items: currentItems })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Reminder could not be saved.');
        if (requestVersion !== recoveryRequestVersion || !consent.checked || String(email.value || '').trim().toLowerCase() !== value.toLowerCase()) {
          if (data.cancelToken) {
            await fetch('/api/cart-recovery/cancel', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: value, token: String(data.cancelToken) })
            }).catch(() => {});
          }
          return;
        }
        cancelToken = String(data.cancelToken || '');
        cancelEmail = value;
        consent.dataset.lastSignature = signature;
        if (!consent.checked) {
          await cancelReminder();
          status.textContent = translate('Reminder cancelled.', 'Xatırlatma ləğv edildi.');
          return;
        }
        status.textContent = translate('Preference saved. One reminder may be sent if the checkout is not completed.', 'Seçiminiz yadda saxlanıldı. Checkout tamamlanmasa bir xatırlatma göndərilə bilər.');
      } catch (error) {
        status.textContent = error.message;
      }
    };
    const schedule = () => {
      const requestVersion = ++recoveryRequestVersion;
      clearTimeout(recoveryTimer);
      recoveryTimer = setTimeout(() => capture(requestVersion), 650);
    };
    $('dgCartRecoveryConsent')?.addEventListener('change', () => {
      if (!$('dgCartRecoveryConsent')?.checked) {
        recoveryRequestVersion += 1;
        clearTimeout(recoveryTimer);
        cancelReminder();
        status.textContent = translate('Reminder cancelled.', 'Xatırlatma ləğv edildi.');
      } else {
        const requestVersion = ++recoveryRequestVersion;
        clearTimeout(recoveryTimer);
        capture(requestVersion);
      }
    });
    email.addEventListener('input', schedule);
    email.addEventListener('blur', schedule);
    $('coCountry')?.addEventListener('change', schedule);
  }

  function observeCheckoutModal(enabled) {
    if (!enabled) return;
    const root = $('modalRoot');
    if (!root || root.dataset.dgRecoveryObserved === 'true') return;
    root.dataset.dgRecoveryObserved = 'true';
    const observer = new MutationObserver(() => attachRecoveryConsent(root, enabled));
    observer.observe(root, { childList: true, subtree: true });
    attachRecoveryConsent(root, enabled);
  }


  function installPairing() {
    window.dgAddBundle = function (firstId, secondId) {
      const first = storeProducts().find(item => Number(item.id) === Number(firstId));
      const second = storeProducts().find(item => Number(item.id) === Number(secondId));
      if (!first || !second || !available(first) || !available(second)) {
        if (typeof showToast === 'function') showToast(translate('One or more products are not available in this market.', 'Məhsullardan biri bu bazarda mövcud deyil.'));
        return;
      }
      if (hasOptions(first) || hasOptions(second)) {
        if (typeof showToast === 'function') showToast(translate('Please choose product options on each product page first.', 'Əvvəlcə hər məhsulun səhifəsində seçimlərini edin.'));
        return;
      }
      const add = product => {
        const existing = state.cart.find(item => Number(item.id) === Number(product.id) && !item.variantColor && !item.variantSize);
        if (existing) existing.qty = Math.min(20, Number(existing.qty || 0) + 1);
        else state.cart.push({ id: Number(product.id), qty: 1, variant: null, variantColor: null, variantSize: null });
      };
      add(first);
      add(second);
      saveAll();
      if (typeof updateCounts === 'function') updateCounts();
      if (typeof showToast === 'function') showToast(translate('Both products were added to your cart.', 'Hər iki məhsul səbətə əlavə edildi.'));
      window.DGAnalytics?.track('add_to_cart', { currency: market().currency, items: analyticsItems([{id:first.id,qty:1},{id:second.id,qty:1}]) });
    };
  }

  function init() {
    baseDescription = document.querySelector('meta[name="description"]')?.content || '';
    baseOgTitle = document.querySelector('meta[property="og:title"]')?.content || document.title;
    baseOgDescription = document.querySelector('meta[property="og:description"]')?.content || baseDescription;
    baseOgImage = document.querySelector('meta[property="og:image"]')?.content || '';
    baseCanonical = document.querySelector('link[rel="canonical"]')?.href || `${window.location.origin}/`;
    getGrowthConfig().then(config => {
      if (config?.publicSiteUrl) baseCanonical = `${String(config.publicSiteUrl).replace(/\/+$/, '')}/`;
      const currentProductId = new URLSearchParams(window.location.search).get('product');
      if (currentProductId) {
        const product = storeProducts().find(item => Number(item.id) === Number(currentProductId));
        if (product) updateProductSeo(product, []);
      } else setCanonical(baseCanonical);
      injectSiteSchema();
    });
    renderTools();
    installAnalyticsHooks();
    installPairing();
    observeProductGrid();
    installProductObserver();

    $('dgRunFinder')?.addEventListener('click', runFinder);
    $('dgFinderKeyword')?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runFinder(); } });
    $('dgFinderCategory')?.addEventListener('change', runFinder);
    $('dgFinderBudget')?.addEventListener('change', runFinder);

    const search = $('searchInput');
    if (search && search.dataset.dgAnalytics !== 'true') {
      search.dataset.dgAnalytics = 'true';
      let timer = null;
      search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const term = search.value.trim();
          const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);
          const digitCount = (term.match(/\d/g) || []).length;
          if (term && !looksLikeEmail && digitCount < 7) window.DGAnalytics?.track('search', { search_term: term.slice(0, 80) });
        }, 700);
      });
    }

    const productId = new URLSearchParams(window.location.search).get('product');
    if (productId) recordViewed(productId);
    getGrowthConfig().then(config => observeCheckoutModal(Boolean(config?.cartRecoveryEnabled)));

    window.addEventListener('dg:products-ready', () => { renderTools(); installAnalyticsHooks(); });
    window.addEventListener('dg:market-change', renderTools);
    window.addEventListener('dg:language-change', renderTools);
    window.addEventListener('popstate', () => {
      const currentId = new URLSearchParams(window.location.search).get('product');
      if (!currentId) restoreHomeSeo();
      else recordViewed(currentId);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
