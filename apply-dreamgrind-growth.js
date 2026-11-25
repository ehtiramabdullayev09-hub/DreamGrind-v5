#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const files = ['public/index.html', 'public/script.js', 'public/dreamgrind-premium.css', 'server.js'];
const packageInfo = path.join(root, 'package.json');
const analyticsPath = path.join(root, 'public/analytics.js');
const backupDir = path.join(root, '.dreamgrind-growth-backup-' + new Date().toISOString().replace(/[:.]/g, '-'));

function fail(message) { console.error('\nINSTALL STOPPED: ' + message); process.exitCode = 1; }
function replaceUnique(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error('Could not find the expected main-branch code for: ' + label);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error('The code anchor is not unique for: ' + label);
  return source.slice(0, first) + after + source.slice(first + before.length);
}
function checkSyntax(file) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Node syntax check failed for ' + file + ':\n' + (result.stderr || result.stdout));
}

try {
  if (!fs.existsSync(packageInfo) || !fs.existsSync(path.join(root, 'public')) || !fs.existsSync(path.join(root, 'server.js'))) {
    throw new Error('Run this installer from the DreamGrind-v5 project root (the folder containing package.json, server.js and public/).');
  }
  const pkg = JSON.parse(fs.readFileSync(packageInfo, 'utf8'));
  if (pkg.name !== 'dreamgrind-store') throw new Error('This does not look like the expected DreamGrind repository. No files were changed.');
  for (const file of files) if (!fs.existsSync(path.join(root, file))) throw new Error('Required file missing: ' + file);
  if (!fs.existsSync(analyticsPath)) throw new Error('public/analytics.js from this ZIP is missing. Extract the ZIP into the project folder and allow the public/ folder to merge.');

  const analytics = fs.readFileSync(analyticsPath, 'utf8');
  if (!analytics.includes('DreamGrind privacy-first GA4 integration')) throw new Error('public/analytics.js is not the expected Growth 1.0 module.');

  const original = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  let html = original['public/index.html'];
  let app = original['public/script.js'];
  let css = original['public/dreamgrind-premium.css'];
  let server = original['server.js'];

  if (html.includes('analytics.js?v=20261126-growth-v1') || app.includes('analyticsItemsFor(') || server.includes('analyticsMeasurementId: GA_MEASUREMENT_ID')) {
    throw new Error('Growth Analytics appears to be installed already. No files were changed.');
  }

  html = replaceUnique(html,
    '<link rel="stylesheet" href="dreamgrind-premium.css?v=20261125-v1">',
    '<link rel="stylesheet" href="dreamgrind-premium.css?v=20261126-growth-v1">',
    'premium CSS cache version');
  html = replaceUnique(html,
    '<script src="script.js?v=20261120-azn-cad-gbp-fix-v4"></script>',
    '<script src="analytics.js?v=20261126-growth-v1" defer></script>\n  <script src="script.js?v=20261126-growth-v1" defer></script>',
    'analytics and storefront script loading');

  server = replaceUnique(server,
    "const EPOINT_PRIVATE_KEY = process.env.EPOINT_PRIVATE_KEY || '';",
    "const EPOINT_PRIVATE_KEY = process.env.EPOINT_PRIVATE_KEY || '';\n// Public GA4 measurement ID. This is an identifier, not a secret key.\nconst GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID || '').trim();",
    'GA4 environment configuration');
  server = replaceUnique(server,
    "app.get('/api/store-config', (_req, res) => res.set('Cache-Control', 'no-store').json({ azerbaijanCheckoutEnabled: AZERBAIJAN_CHECKOUT_ENABLED, azerbaijanShippingQuoteRequired: false }));",
    "app.get('/api/store-config', (_req, res) => res.set('Cache-Control', 'no-store').json({ azerbaijanCheckoutEnabled: AZERBAIJAN_CHECKOUT_ENABLED, azerbaijanShippingQuoteRequired: false, analyticsMeasurementId: GA_MEASUREMENT_ID }));",
    'public store-config response');
  server = replaceUnique(server,
    "    currency: order.currency || 'AZN'\n  } });",
    "    currency: order.currency || 'AZN',\n    marketTotal: order.marketTotal ?? null,\n    marketCurrency: order.marketCurrency || null\n  } });",
    'order tracking market-currency fields');

  const helper = `function analyticsItemsFor(items) {\n  return (Array.isArray(items) ? items : []).map(item => {\n    const product = products.find(p => Number(p.id) === Number(item.id));\n    if (!product) return null;\n    const qty = Math.max(1, Number(item.qty) || 1);\n    const price = Number(cartItemPrice(product, item));\n    const variantParts = [item.variantColor, item.variantSize, item.variant].filter(Boolean);\n    return {\n      item_id: String(product.id),\n      item_name: String(product.title || 'DreamGrind product').slice(0, 100),\n      item_category: String(product.category || 'General').slice(0, 80),\n      ...(variantParts.length ? { item_variant: variantParts.join(' / ').slice(0, 100) } : {}),\n      price: Number((Number.isFinite(price) ? price : 0).toFixed(2)),\n      quantity: qty\n    };\n  }).filter(Boolean);\n}\nfunction analyticsValueFor(items) {\n  const config = currencyConfig();\n  const gaItems = analyticsItemsFor(items);\n  const value = gaItems.reduce((sum, item) => sum + item.price * item.quantity, 0);\n  return { currency: config.currency, value: Number(value.toFixed(2)), items: gaItems };\n}\n`;
  app = replaceUnique(app, '\nconst USD_TO_AZN = 1.70;', '\n' + helper + 'const USD_TO_AZN = 1.70;', 'ecommerce analytics helpers');
  app = replaceUnique(app,
    '  applyLanguage(lang);\n  syncCountryPicker();',
    '  applyLanguage(lang);\n  syncCountryPicker();\n  window.dispatchEvent(new Event(\'dg:language-change\'));',
    'language preference change event');
  app = replaceUnique(app,
    "function toggleWishlist(id) { state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id); saveAll(); renderProducts(); showToast(state.wishlist.has(id) ? 'Added to wishlist' : 'Removed from wishlist'); }",
    "function toggleWishlist(id) { const adding=!state.wishlist.has(id); if(adding)state.wishlist.add(id);else state.wishlist.delete(id);saveAll();if(adding){const product=products.find(p=>String(p.id)===String(id));if(product)window.DGAnalytics?.track('add_to_wishlist',{currency:currencyConfig().currency,value:productPriceForCountry(product),items:analyticsItemsFor([{id:product.id,qty:1}])});}renderProducts();showToast(adding?'Added to wishlist':'Removed from wishlist');}",
    'wishlist event');
  app = replaceUnique(app,
    "saveAll(); showToast('Added to cart'); openCart(); }",
    "saveAll(); window.DGAnalytics?.track('add_to_cart',analyticsValueFor([{id:product.id,qty:1}])); showToast('Added to cart'); openCart(); }",
    'quick-add event');
  app = replaceUnique(app,
    'function openProduct(id) {\n  const p = products.find(x => String(x.id) === String(id));\n  if (!p) return;\n\n  if (!productPageOpen)',
    "function openProduct(id) {\n  const p = products.find(x => String(x.id) === String(id));\n  if (!p) return;\n\n  window.DGAnalytics?.track('select_item',{item_list_name:state.category==='All'?'Trending products':state.category,items:analyticsItemsFor([{id:p.id,qty:1}])});\n  if (!productPageOpen)",
    'product selection event');
  app = replaceUnique(app,
    '  document.title = `${p.title} | DreamGrind`;\n  const availableInMarket = isProductAvailableInCountry(p);',
    "  document.title = `${p.title} | DreamGrind`;\n  const availableInMarket = isProductAvailableInCountry(p);\n  window.DGAnalytics?.track('view_item',{currency:currencyConfig().currency,value:productPriceForCountry(p),items:analyticsItemsFor([{id:p.id,qty:1}])});",
    'product view event');
  app = replaceUnique(app,
    "saveAll(); showToast('Added to cart');\n  if (productPageOpen)",
    "saveAll();\n  window.DGAnalytics?.track('add_to_cart',analyticsValueFor([{id:product.id,qty,...selection}]));\n  showToast('Added to cart');\n  if (productPageOpen)",
    'product detail add-to-cart event');
  app = replaceUnique(app,
    "  const total = sub + ship;\n  const isAz = c.country === 'AZ';",
    "  const total = sub + ship;\n  window.DGAnalytics?.track('view_cart',analyticsValueFor(state.cart));\n  const isAz = c.country === 'AZ';",
    'cart view event');
  app = replaceUnique(app,
    "  sessionStorage.setItem('dg_checkout_mode', Array.isArray(items) ? 'buy-now' : 'cart');",
    "  sessionStorage.setItem('dg_checkout_mode', Array.isArray(items) ? 'buy-now' : 'cart');\n  const analyticsCheckout = analyticsValueFor(checkoutItems);\n  sessionStorage.setItem('dg_analytics_checkout',JSON.stringify(analyticsCheckout));\n  window.DGAnalytics?.track('begin_checkout',analyticsCheckout);",
    'checkout start event');
  app = replaceUnique(app,
    "  if (submitButton) {\n    submitButton.disabled = true;\n    submitButton.textContent = 'Preparing secure payment…';\n  }",
    "  const analyticsCheckout = analyticsValueFor(checkoutItems);\n  window.DGAnalytics?.track('add_shipping_info',{...analyticsCheckout,destination_country:checkoutCountry});\n\n  if (submitButton) {\n    submitButton.disabled = true;\n    submitButton.textContent = 'Preparing secure payment…';\n  }",
    'shipping info event');
  app = replaceUnique(app,
    '    window.location.href = payment.redirect_url;',
    "    window.DGAnalytics?.track('add_payment_info',{...analyticsValueFor(checkoutItems),payment_type:'Epoint'});\n    window.location.href = payment.redirect_url;",
    'payment step event');
  app = replaceUnique(app,
    "  if (order?.paymentStatus === 'Paid') {\n    if (checkoutMode !== 'buy-now') {",
    "  if (order?.paymentStatus === 'Paid') {\n    const savedAnalyticsCheckout=(()=>{try{return JSON.parse(sessionStorage.getItem('dg_analytics_checkout')||'null');}catch(_){return null;}})();\n    if(savedAnalyticsCheckout){\n      const purchasePayload={transaction_id:returnedOrderId,value:Number(order.marketTotal??savedAnalyticsCheckout.value??order.total??0),currency:order.marketCurrency||savedAnalyticsCheckout.currency||order.currency||'AZN',items:Array.isArray(savedAnalyticsCheckout.items)?savedAnalyticsCheckout.items:[]};\n      sessionStorage.setItem('dg_pending_purchase',JSON.stringify(purchasePayload));\n      window.DGAnalytics?.flushPendingPurchase?.();\n    }\n    sessionStorage.removeItem('dg_analytics_checkout');\n    if (checkoutMode !== 'buy-now') {",
    'purchase event after server-confirmed payment');
  app = replaceUnique(app,
    "$('newsletterEmail').value = ''; showToast('Subscribed'); }",
    "$('newsletterEmail').value = ''; window.DGAnalytics?.track('generate_lead',{form_name:'newsletter'}); showToast('Subscribed'); }",
    'newsletter conversion event');
  app = replaceUnique(app,
    '        <div class="policy-copy">\n          ${selected.html}\n        </div>',
    '        <div class="policy-copy">\n          ${selected.html}\n        </div>\n        ${type === \'cookies\' ? `<button type="button" class="secondary-button" style="margin-top:16px" onclick="window.DGAnalytics?.openSettings?.()">Manage cookie preferences</button>` : \'\'}',
    'cookie settings link');
  app = replaceUnique(app,
    '<p>Some services used by the website, such as payment processing or hosting infrastructure, may use their own technical cookies or similar technologies where necessary to provide their services.</p>',
    '<p>Some services used by the website, such as payment processing or hosting infrastructure, may use their own technical cookies or similar technologies where necessary to provide their services.</p>\n\n        <h3>Optional analytics</h3>\n        <p>DreamGrind may use Google Analytics to measure store visits and shopping steps only after you choose to allow optional analytics. Advertising storage and advertising personalization remain disabled. You can change your choice at any time through Cookie settings in this policy.</p>',
    'cookie policy analytics notice');

  css += `\n\n/* DreamGrind Growth 1.0: privacy-first cookie consent UI */\n` +
    `.dg-consent-banner{position:fixed;z-index:9997;left:18px;bottom:18px;width:min(720px,calc(100vw - 36px));display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:20px;padding:18px 20px;border:1px solid #dce8f1;border-radius:19px;background:rgba(255,255,255,.98);color:#18334b;box-shadow:0 22px 65px rgba(5,28,48,.20);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}\n` +
    `.dg-consent-copy strong{display:block;color:#102b43;font-size:15px;letter-spacing:-.02em}.dg-consent-copy p{margin:7px 0 0;color:#65798c;font-size:12px;line-height:1.6}\n` +
    `.dg-consent-actions{display:flex;flex-wrap:wrap;align-items:center;gap:7px}.dg-consent-actions button{min-height:38px;padding:9px 12px;border-radius:10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}\n` +
    `.dg-consent-primary{border:1px solid #087fc2;background:linear-gradient(110deg,#086fae,#079fd0);color:#fff}.dg-consent-secondary{border:1px solid #dce7f0;background:#f7fafc;color:#36536b}.dg-consent-link{border:0;background:transparent;color:#087caf;text-decoration:underline;text-underline-offset:3px}\n` +
    `.dg-consent-overlay{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;padding:18px;background:rgba(5,20,34,.58);backdrop-filter:blur(5px)}.dg-consent-dialog{width:min(490px,100%);padding:24px;border:1px solid #e2ebf2;border-radius:22px;background:#fff;color:#17324a;box-shadow:0 28px 90px rgba(7,34,57,.25)}\n` +
    `.dg-consent-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.dg-consent-heading h2{margin:0;color:#102b43;font-size:23px;letter-spacing:-.045em}.dg-consent-dialog>p{margin:12px 0 18px;color:#667b8f;font-size:13px;line-height:1.65}\n` +
    `.dg-consent-close{width:34px;height:34px;border:0;border-radius:10px;background:#eff5f9;color:#23445f;font-size:22px;cursor:pointer}.dg-consent-choice{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #e8eef3}.dg-consent-choice strong{display:block;color:#18364f;font-size:13px}.dg-consent-choice small{display:block;max-width:360px;margin-top:4px;color:#718396;font-size:11px;line-height:1.5}.dg-consent-choice input{width:19px;height:19px;accent-color:#087fc2;flex:0 0 auto}.dg-consent-dialog .dg-consent-actions{justify-content:flex-end;margin-top:14px}\n` +
    `@media(max-width:680px){.dg-consent-banner{left:10px;right:10px;bottom:10px;width:auto;grid-template-columns:1fr;gap:12px;padding:15px;border-radius:17px}.dg-consent-copy p{font-size:11px}.dg-consent-actions{display:grid;grid-template-columns:1fr 1fr}.dg-consent-actions button{width:100%}.dg-consent-actions .dg-consent-link{grid-column:1/-1}.dg-consent-dialog{padding:19px;border-radius:19px}}\n`;

  // Ensure the new purchase event remains nested under the existing Paid status check.
  if (!app.includes("if (order?.paymentStatus === 'Paid')") || !app.includes("window.location.href = payment.redirect_url;")) throw new Error('Epoint/paid-order safeguards were not found after patching.');
  if (!server.includes('EPOINT_PUBLIC_KEY') || !server.includes('EPOINT_PRIVATE_KEY') || !server.includes("app.post('/api/payment/create'")) throw new Error('Payment configuration/routes failed the safety check.');
  if (!app.includes("track('purchase'") && !app.includes('flushPendingPurchase')) throw new Error('Purchase tracking hook was not applied.');
  if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) throw new Error('CSS braces are unbalanced.');

  fs.mkdirSync(backupDir, { recursive: true });
  for (const file of files) fs.copyFileSync(path.join(root, file), path.join(backupDir, path.basename(file)));
  try {
    fs.writeFileSync(path.join(root, 'public/index.html'), html, 'utf8');
    fs.writeFileSync(path.join(root, 'public/script.js'), app, 'utf8');
    fs.writeFileSync(path.join(root, 'public/dreamgrind-premium.css'), css, 'utf8');
    fs.writeFileSync(path.join(root, 'server.js'), server, 'utf8');
    checkSyntax('public/script.js');
    checkSyntax('public/analytics.js');
    checkSyntax('server.js');
  } catch (error) {
    for (const file of files) fs.copyFileSync(path.join(backupDir, path.basename(file)), path.join(root, file));
    throw error;
  }

  console.log('\nDreamGrind Growth 1.0 analytics patch installed successfully.');
  console.log('Changed: public/index.html, public/script.js, public/dreamgrind-premium.css, server.js');
  console.log('Added: public/analytics.js');
  console.log('Backup: ' + path.basename(backupDir));
  console.log('Syntax checks: passed for public/script.js, public/analytics.js and server.js');
  console.log('\nNext: add GA_MEASUREMENT_ID to Render Environment, then upload/commit these five files.');
} catch (error) {
  fail(error.message);
}
