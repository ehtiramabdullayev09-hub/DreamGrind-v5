/* DreamGrind viral motion add-on. Progressive enhancement only. */
(() => {
  'use strict';

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
  const saveData = Boolean(navigator.connection?.saveData);
  const getProduct = (id) => Array.isArray(window.products)
    ? window.products.find((p) => String(p.id) === String(id)) || null
    : null;

  // Parse stable product ids from existing card actions. Never execute inline code.
  const cardProductId = (card) => {
    const controls = card.querySelectorAll('[onclick]');
    for (const control of controls) {
      const action = control.getAttribute('onclick') || '';
      const match = action.match(/^\s*(?:openProduct|quickAdd)\((\d+)\)\s*;?\s*$/);
      if (match) return match[1];
    }
    return null;
  };
  const hasOptions = (product) => {
    if (!product) return true;
    try {
      if (typeof window.productVariantCombinations === 'function' && window.productVariantCombinations(product).length) return true;
    } catch (_) { return true; }
    return Array.isArray(product.variants) && product.variants.length > 0;
  };

  const cartCount = document.getElementById('cartCount');
  const cartButton = document.querySelector('.cart-button');

  // Animate only after the store's actual cart count increases.
  if (cartCount && cartButton && !reduced && 'MutationObserver' in window) {
    let previous = Number(cartCount.textContent) || 0;
    new MutationObserver(() => {
      const current = Number(cartCount.textContent) || 0;
      if (current > previous) {
        cartButton.classList.remove('dg-bump');
        void cartButton.offsetWidth;
        cartButton.classList.add('dg-bump');
        window.setTimeout(() => cartButton.classList.remove('dg-bump'), 650);
      }
      previous = current;
    }).observe(cartCount, { childList: true, characterData: true, subtree: true });
  }

  let pendingAdd = null;
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('.add-mini');
    if (!button) return;
    const card = button.closest('.product-card');
    const product = card ? getProduct(cardProductId(card)) : null;
    if (!card || !product || hasOptions(product)) {
      pendingAdd = null;
      return;
    }
    pendingAdd = {
      button,
      card,
      before: Number(cartCount?.textContent) || 0,
      originalText: button.textContent
    };
    window.setTimeout(() => {
      const item = pendingAdd;
      if (!item || item.button !== button) return;
      const after = Number(cartCount?.textContent) || 0;
      if (after > item.before && button.isConnected) {
        button.classList.add('dg-added');
        button.textContent = '\u2713';
        window.setTimeout(() => {
          if (!button.isConnected) return;
          button.classList.remove('dg-added');
          button.textContent = item.originalText;
        }, 900);
        if (!reduced && cartButton) flyToCart(item.card, cartButton);
      }
      pendingAdd = null;
    }, 0);
  }, false);

  function flyToCart(card, target) {
    const image = card.querySelector('.product-image-wrap > img');
    if (!image || typeof image.animate !== 'function') return;
    const from = image.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height) return;
    const size = Math.min(from.width, 140);
    const fly = document.createElement('img');
    fly.className = 'dg-fly';
    fly.src = image.currentSrc || image.src;
    fly.alt = '';
    fly.setAttribute('aria-hidden', 'true');
    Object.assign(fly.style, {
      width: size + 'px',
      height: size + 'px',
      left: (from.left + from.width / 2 - size / 2) + 'px',
      top: (from.top + from.height / 2 - size / 2) + 'px'
    });
    document.body.appendChild(fly);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const animation = fly.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + (dx * .55) + 'px,' + (dy * .55 - 48) + 'px) scale(.6)', opacity: .95, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: .2 }
    ], { duration: 650, easing: 'cubic-bezier(.5,0,.75,.4)' });
    animation.onfinish = animation.oncancel = () => fly.remove();
  }

  // Optional media previews are desktop-only; never autoplay video on mobile.
  const ensureMedia = (card) => {
    const wrap = card.querySelector('.product-image-wrap');
    if (!wrap) return null;
    const existing = wrap.querySelector('.dg-card-video, .dg-card-alt');
    if (existing) return { wrap, media: existing };
    const product = getProduct(cardProductId(card));
    if (!product || !canHover) return null;

    let media = null;
    if (!saveData && product.video) {
      media = document.createElement('video');
      media.className = 'dg-card-video';
      media.muted = true;
      media.defaultMuted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = 'none';
      media.setAttribute('aria-hidden', 'true');
      media.src = String(product.video);
    } else if (Array.isArray(product.images)) {
      const second = product.images.filter(Boolean)[1];
      if (!second) return null;
      media = document.createElement('img');
      media.className = 'dg-card-alt';
      media.alt = '';
      media.decoding = 'async';
      media.loading = 'lazy';
      media.src = String(second);
    }
    if (!media) return null;
    wrap.appendChild(media);
    return { wrap, media };
  };

  const showPreview = (card) => {
    const result = ensureMedia(card);
    if (!result) return;
    result.wrap.classList.add('dg-media-on');
    if (result.media.tagName === 'VIDEO') {
      const playResult = result.media.play();
      if (playResult?.catch) playResult.catch(() => result.wrap.classList.remove('dg-media-on'));
    }
  };
  const hidePreview = (card) => {
    const wrap = card.querySelector('.product-image-wrap');
    if (!wrap) return;
    wrap.classList.remove('dg-media-on');
    const video = wrap.querySelector('.dg-card-video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  if (canHover && !reduced) {
    document.addEventListener('pointerover', (event) => {
      const card = event.target?.closest?.('.product-card');
      if (card && !card.contains(event.relatedTarget)) showPreview(card);
    }, { passive: true });
    document.addEventListener('pointerout', (event) => {
      const card = event.target?.closest?.('.product-card');
      if (card && !card.contains(event.relatedTarget)) hidePreview(card);
    }, { passive: true });
  }
})();
