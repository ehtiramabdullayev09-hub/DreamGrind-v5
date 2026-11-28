/* DreamGrind storefront micro-interactions. Hooks into the existing storefront lifecycle. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
  const saveData = Boolean(navigator.connection?.saveData);
  const cartCount = document.getElementById('cartCount');
  const cartButton = document.querySelector('.cart-button');
  let lastCartCount = Number(cartCount?.textContent) || 0;
  let pendingFly = null;

  // Script.js exposes a safe snapshot for this optional enhancement; it is refreshed after every render.
  function productForCard(card) {
    const id = card?.dataset?.productId;
    if (!id || !Array.isArray(window.__dgProductsForMotion)) return null;
    return window.__dgProductsForMotion.find((product) => String(product.id) === String(id)) || null;
  }

  function playCartBump() {
    if (!cartButton || reducedMotion) return;
    cartButton.classList.remove('dg-bump');
    void cartButton.offsetWidth;
    cartButton.classList.add('dg-bump');
    window.setTimeout(() => cartButton.classList.remove('dg-bump'), 650);
  }

  function flyImageToCart(image, target = cartButton) {
    if (!image || !target || reducedMotion || typeof image.animate !== 'function') return;
    const from = image.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;

    const size = Math.min(from.width, 132);
    const fly = document.createElement('img');
    fly.className = 'dg-fly';
    fly.src = image.currentSrc || image.src;
    fly.alt = '';
    fly.setAttribute('aria-hidden', 'true');
    Object.assign(fly.style, {
      width: size + 'px', height: size + 'px',
      left: (from.left + from.width / 2 - size / 2) + 'px',
      top: (from.top + from.height / 2 - size / 2) + 'px'
    });
    document.body.appendChild(fly);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const animation = fly.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + (dx * .55) + 'px,' + (dy * .55 - 42) + 'px) scale(.62)', opacity: .92, offset: .56 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: .12 }
    ], { duration: 650, easing: 'cubic-bezier(.45,0,.75,.45)' });
    animation.onfinish = animation.oncancel = () => fly.remove();
  }

  function markAddButton(button) {
    if (!button || !button.isConnected) return;
    const original = button.dataset.dgOriginalText || button.textContent;
    button.dataset.dgOriginalText = original;
    button.classList.add('dg-added');
    button.textContent = '\\u2713';
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.classList.remove('dg-added');
      button.textContent = button.dataset.dgOriginalText || original;
    }, 900);
  }

  // The original image is measured and cloned before quickAdd opens the cart drawer.
  window.DGMotionBeforeQuickAdd = (productId, button) => {
    const card = button?.closest('.product-card');
    const image = card?.querySelector('.product-image-wrap > img');
    pendingFly = image ? { image, before: Number(cartCount?.textContent) || 0 } : null;
  };

  // Runs immediately after saveAll() updates the real cart count, before openCart().
  window.DGMotionAfterCartUpdate = (button = null) => {
    const now = Number(cartCount?.textContent) || 0;
    if (now > lastCartCount) {
      playCartBump();
      if (pendingFly && pendingFly.before < now) flyImageToCart(pendingFly.image);
      if (button) markAddButton(button);
    }
    lastCartCount = now;
    pendingFly = null;
  };

  function ensurePreview(card) {
    const wrap = card?.querySelector('.product-image-wrap');
    if (!wrap) return null;
    let media = wrap.querySelector('.dg-card-video, .dg-card-alt');
    if (media) return { wrap, media };

    const product = productForCard(card);
    if (!product) return null;
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const videoUrl = typeof product.video === 'string' ? product.video.trim() : '';
    if (canHover && !saveData && videoUrl) {
      media = document.createElement('video');
      media.className = 'dg-card-video';
      media.muted = true;
      media.defaultMuted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = 'none';
      media.setAttribute('aria-hidden', 'true');
      media.src = videoUrl;
    } else if (images.length > 1) {
      media = document.createElement('img');
      media.className = 'dg-card-alt';
      media.alt = '';
      media.decoding = 'async';
      media.loading = 'lazy';
      media.src = images[1];
    }
    if (!media) return null;
    wrap.appendChild(media);
    return { wrap, media };
  }

  function showPreview(card) {
    const result = ensurePreview(card);
    if (!result) return;
    result.wrap.classList.add('dg-media-on');
    if (result.media.tagName === 'VIDEO') {
      const play = result.media.play();
      if (play?.catch) play.catch(() => result.wrap.classList.remove('dg-media-on'));
    }
  }

  function hidePreview(card) {
    const wrap = card?.querySelector('.product-image-wrap');
    if (!wrap) return;
    wrap.classList.remove('dg-media-on');
    const video = wrap.querySelector('.dg-card-video');
    if (video) {
      video.pause();
      try { video.currentTime = 0; } catch (_) {}
    }
  }

  // Delegation keeps working when renderProducts() replaces cards for search, sort or country changes.
  if (canHover && !reducedMotion) {
    document.addEventListener('pointerover', (event) => {
      const card = event.target?.closest?.('.product-card[data-product-id]');
      if (card && !card.contains(event.relatedTarget)) showPreview(card);
    }, { passive: true });
    document.addEventListener('pointerout', (event) => {
      const card = event.target?.closest?.('.product-card[data-product-id]');
      if (card && !card.contains(event.relatedTarget)) hidePreview(card);
    }, { passive: true });
  }

  window.DGMotionReady = true;
})();