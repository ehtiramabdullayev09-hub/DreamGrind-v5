import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { isValidGtin } from '../lib/gtin.js';

const root = process.cwd();
const read = relative => readFile(path.join(root, relative), 'utf8');

function checkJavaScript(relative, source) {
  const result = spawnSync(process.execPath, ['--check', relative], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${relative} syntax check failed:\n${result.stderr || result.stdout}`);
  return source;
}

test('all storefront scripts and styles referenced by index.html exist', async () => {
  const html = await read('public/index.html');
  const assets = [
    ...[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1].split('?')[0]),
    ...[...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/gi)].map(match => match[1].split('?')[0])
  ];
  assert.ok(assets.length >= 5, 'expected the core and Growth 2.0 frontend assets');
  for (const asset of assets) await access(path.join(root, 'public', asset));
});

test('all shipped JavaScript files parse, including Admin inline code', async () => {
  for (const file of ['server.js', 'database.js', 'lib/gtin.js', 'public/script.js', 'public/analytics.js', 'public/growth.js', 'public/motion.js']) {
    checkJavaScript(file, await read(file));
  }
  const admin = await read('public/admin.html');
  const inline = [...admin.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  assert.equal(inline.length, 1, 'expected one Admin inline script');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dreamgrind-admin-check-'));
  try {
    const scriptPath = path.join(directory, 'admin-inline.js');
    await writeFile(scriptPath, inline[0], 'utf8');
    const result = spawnSync(process.execPath, ['--check', scriptPath], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('GTIN validator accepts valid check digits and rejects invalid values', () => {
  assert.equal(isValidGtin('4006381333931'), true); // GTIN-13
  assert.equal(isValidGtin('96385074'), true); // GTIN-8
  assert.equal(isValidGtin('036000291452'), true); // GTIN-12
  assert.equal(isValidGtin('4006381333932'), false); // invalid check digit
  assert.equal(isValidGtin('12345'), false); // unsupported length
});

test('Epoint payment contract remains present and purchase tracking is paid-only', async () => {
  const server = await read('server.js');
  const script = await read('public/script.js');
  assert.match(server, /app\.post\(['"]\/api\/payment\/create['"]/);
  assert.match(server, /app\.post\(['"]\/api\/payment\/callback['"]/);
  assert.match(server, /createEpointPayment\(/);
  assert.match(server, /timingSafeEqual\(/);
  assert.match(server, /Payment amount does not match the order/);
  assert.match(script, /window\.location\.href\s*=\s*payment\.redirect_url/);
  assert.match(script, /order\?\.paymentStatus\s*===\s*['"]Paid['"]/);
  assert.match(script, /dg_pending_purchase/);
});

test('reviews are tied to paid orders and Merchant feed rejects incomplete identifiers', async () => {
  const server = await read('server.js');
  assert.match(server, /item\.paymentStatus\s*===\s*['"]Paid['"]/);
  assert.match(server, /item\.id\)\s*===\s*productId/);
  assert.match(server, /\/feed\/google\.xml/);
  assert.match(server, /isValidGtin\(product\.gtin\)/);
  assert.match(server, /Number\(product\.stock\)\s*>\s*0/);
});

test('analytics requires consent and does not enable ad personalization', async () => {
  const analytics = await read('public/analytics.js');
  assert.match(analytics, /consentGranted\(\)/);
  assert.match(analytics, /analytics_storage:\s*'denied'/);
  assert.match(analytics, /ad_storage:\s*'denied'/);
  assert.match(analytics, /ad_personalization:\s*'denied'/);
  assert.match(analytics, /gtag\(\s*'consent'\s*,\s*'update'/);
});

test('existing JSON database state is extended without replacing its data model', async () => {
  const database = await read('database.js');
  const server = await read('server.js');
  assert.match(database, /users:\s*\[\]/);
  assert.match(database, /products:\s*\[\]/);
  assert.match(database, /orders:\s*\[\]/);
  assert.match(database, /reviews:\s*\[\]/);
  assert.match(database, /cartRecoveries:\s*\[\]/);
  assert.match(server, /db\.data\.reviews\s*\|\|=/);
  assert.match(server, /db\.data\.cartRecoveries\s*\|\|=/);
  assert.match(database, /dreamgrind_state/);
});

test('Growth 2.1 includes functional paired-product cart action', async () => {
  const growth = await read('public/growth.js');
  assert.match(growth, /window\.dgAddBundle\s*=\s*function/);
  assert.match(growth, /state\.cart\.push/);
  assert.match(growth, /saveAll\(\)/);
});

test('Google feed does not claim universal free shipping without configured rates', async () => {
  const server = await read('server.js');
  const feedStart = server.indexOf("app.get('/feed/google.xml'");
  const feedEnd = server.indexOf("app.get('/api/reviews/:productId'", feedStart);
  assert.ok(feedStart >= 0 && feedEnd > feedStart, 'Google feed route must exist');
  const feed = server.slice(feedStart, feedEnd);
  assert.doesNotMatch(feed, /<g:service>Free shipping<\/g:service>/);
  assert.doesNotMatch(feed, /<g:price>0\.00 \$\{currency\}<\/g:price>/);
});

test('product-card ratings use verified review aggregates only', async () => {
  const script = await read('public/script.js');
  assert.match(script, /verifiedReviewCount/);
  assert.match(script, /verifiedAverageRating/);
});

test('Growth quality workflow runs the release tests on pushes and pull requests', async () => {
  const workflow = await read('.github/workflows/growth-quality.yml');
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /pull_request/);
});

test('conversion trust updates include real brand copy and persistent WhatsApp contact', async () => {
  const html = await read('public/index.html');
  const css = await read('public/style.css');
  const script = await read('public/script.js');
  assert.match(html, /dg-floating-whatsapp/);
  assert.match(css, /\.dg-floating-whatsapp/);
  assert.ok(html.includes('Useful everyday finds, thoughtfully selected'));
  assert.doesNotMatch(html, /A modern storefront foundation for international customers/);
  assert.match(script, /Shipping cost and delivery estimate shown at checkout/);
  assert.match(script, /Delivery and confirmed charges included in the displayed AZN price/);
});

test('DreamGrind visual layer keeps its navy and cyan brand palette', async () => {
  const css = await read('public/dreamgrind-premium.css');
  const html = await read('public/index.html');
  assert.ok(css.includes('--dg-navy: #071a2c;'));
  assert.ok(css.includes('--dg-cyan: #15b8df;'));
  assert.ok(html.includes('dreamgrind-premium.css?v=20261127-center-v3'));
});
test('Design-system refresh preserves core storefront sections and handlers', async () => {
  const html = await read('public/index.html');
  const script = await read('public/script.js');
  for (const id of ['shop','categories','about','modalRoot','productGrid','countryPicker']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const handler of ['setCountry','setLanguage','openCart','openWishlist','addProductFromDetail','buyNowFromDetail']) {
    assert.ok(script.includes(handler), 'Missing handler: ' + handler);
  }
});

test('The DreamGrind Edit collections route to existing catalogue categories', async () => {
  const html = await read('public/index.html');
  for (const id of ['dg-edit','dgEditTitle','dgEditCollections']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing collection section element: ' + id);
  }
  for (const category of ['Home','Pet','Gadgets','Lifestyle']) {
    assert.ok(html.includes("setCategory('" + category + "')"), 'Missing collection route: ' + category);
  }
  for (const title of ['The Cozy Home Edit','The Pet Parent Edit','The Everyday Upgrade','The Little Things Edit']) {
    assert.ok(html.includes(title), 'Missing editorial collection: ' + title);
  }
});

test('homepage hero links to the primary shop and the DreamGrind Edit', async () => {
  const html = await read('public/index.html');
  const css = await read('public/dreamgrind-premium.css');
  assert.ok(html.includes('Find your next'));
  assert.ok(html.includes('href="#shop"'));
  assert.ok(html.includes('href="#dg-edit"'));
  assert.ok(css.includes('Signature homepage hero typography'));
});

test('DreamGrind Edit is responsive at tablet and mobile widths', async () => {
  const css = await read('public/growth.css');
  assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
  assert.ok(css.includes('@media(max-width:900px)'));
  assert.ok(css.includes('@media(max-width:560px)'));
});

test('all storefront assets use the current editorial cache key', async () => {
  const html = await read('public/index.html');
  for (const asset of ['style.css','growth.css','script.js','analytics.js','growth.js']) {
    const expectedVersion = ['script.js','analytics.js','growth.js'].includes(asset) ? '?v=20261127-edit-v2' : '?v=20261127-edit-v1';
  }
  assert.ok(html.includes('dreamgrind-premium.css?v=20261127-center-v3'), 'Premium CSS must use the current centered-emblem cache key');
});


test('hero DG emblem is mathematically centered and has no scale offset', async () => {
  const css = await read('public/dreamgrind-premium.css');
  assert.match(css, /\.brand-art-scene\s*\{[^}]*position:\s*relative/s);
  assert.match(css, /\.brand-art-core\s*\{[^}]*top:\s*50%[^}]*left:\s*50%[^}]*transform:\s*translate\(-50%\s*,\s*-50%\)/s);
  assert.doesNotMatch(css, /\.brand-art-core\s*\{\s*transform:\s*scale\(1\.04\)/);
});

test('hero DG emblem keeps the original clean monogram without overlapping caption text', async () => {
  const html = await read('public/index.html');
  assert.ok(html.includes('<span class="brand-art-monogram">DG</span>'));
  assert.doesNotMatch(html, /brand-art-core-caption|FIND YOUR EVERYDAY/);
});


test('premium motion system is progressive, accessible and does not alter commerce handlers', async () => {
  const html = await read('public/index.html');
  const css = await read('public/dreamgrind-premium.css');
  const motion = await read('public/motion.js');
  const script = await read('public/script.js');
  const server = await read('server.js');
  assert.ok(html.includes('motion.js?v=20261127-motion-v1'));
  assert.match(motion, /IntersectionObserver/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.match(motion, /animation-timeline: view\(\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /transform:translate3d/);
  assert.match(script, /payment\/create|createEpointPayment/);
  assert.match(server, /createEpointPayment/);
  assert.match(html, /id="productGrid"/);
  assert.match(html, /id="countryPicker"/);
});


test('SEO landing route renders Product and Breadcrumb JSON-LD before client scripts', async () => {
  const server = await read('server.js');
  assert.match(server, /app\.get\('\/',\s*\(req,res,next\)/);
  assert.match(server, /function renderProductLandingPage/);
  assert.match(server, /application\/ld\+json/);
  assert.match(server, /canonical/);
  assert.match(server, /availability.*schema\.org|schema\.org.*availability/);
});

test('sitemap includes all store markets while Merchant feeds target supported Shopping countries only', async () => {
  const server = await read('server.js');
  const sitemapStart = server.indexOf("app.get('/sitemap.xml'");
  const sitemapEnd = server.indexOf("function escapeHtml(value)", sitemapStart);
  const sitemap = server.slice(sitemapStart, sitemapEnd);
  assert.match(sitemap, /&country=\$\{market\.code\}/);
  const feedStart = server.indexOf("app.get('/feed/google.xml'");
  const feedEnd = server.indexOf("app.get('/api/reviews/:productId'", feedStart);
  const feed = server.slice(feedStart, feedEnd);
  assert.match(feed, /&country=' \+ code/);
  assert.match(feed, /US:\{country:'United States',currency:'USD'\}/);
  assert.match(feed, /CA:\{country:'Canada',currency:'CAD'\}/);
  assert.match(feed, /UK:\{country:'United Kingdom',currency:'GBP'\}/);
  assert.doesNotMatch(feed, /AZ:\{country:'Azerbaijan'/);
  assert.match(feed, /product\.identifierExists === false/);
  assert.ok(feed.includes('<g:identifier_exists>no</g:identifier_exists>'));
  assert.match(feed, /market\.currency/);
  assert.match(feed, /variantCombinations/);
  assert.match(feed, /isValidGtin/);
  assert.doesNotMatch(feed, /free shipping|<g:shipping>/i);
});

test('country-specific product links set the storefront currency before price rendering', async () => {
  const script = await read('public/script.js');
  assert.match(script, /queryCountry/);
  assert.match(script, /includes\(queryCountry\)/);
  assert.match(script, /country = \['US','CA','UK','AZ'\]/);
});

test('analytics ecommerce events use beacon transport and purchase remains idempotent', async () => {
  const analytics = await read('public/analytics.js');
  assert.match(analytics, /transport_type:\s*'beacon'/);
  assert.match(analytics, /dg_purchase_sent_/);
  assert.match(analytics, /transaction_id/);
});


test('SEO landing route renders Product and Breadcrumb JSON-LD before client scripts', async () => {
  const server = await read('server.js');
  assert.match(server, /app\.get\('\/',\s*\(req,res,next\)/);
  assert.match(server, /function renderProductLandingPage/);
  assert.match(server, /application\/ld\+json/);
  assert.match(server, /BreadcrumbList/);
  assert.match(server, /canonical/);
  assert.match(server, /priceCurrency:market\.currency/);
});

test('sitemap includes all store markets while Merchant feeds target supported Shopping countries only', async () => {
  const server = await read('server.js');
  const sitemapStart = server.indexOf("app.get('/sitemap.xml'");
  const sitemapEnd = server.indexOf("function escapeHtml(value)", sitemapStart);
  const sitemap = server.slice(sitemapStart, sitemapEnd);
  assert.match(sitemap, /&country=\$\{market\.code\}/);
  const feedStart = server.indexOf("app.get('/feed/google.xml'");
  const feedEnd = server.indexOf("app.get('/api/reviews/:productId'", feedStart);
  const feed = server.slice(feedStart, feedEnd);
  assert.match(feed, /&country=' \+ code/);
  assert.match(feed, /US:\{country:'United States',currency:'USD'\}/);
  assert.match(feed, /CA:\{country:'Canada',currency:'CAD'\}/);
  assert.match(feed, /UK:\{country:'United Kingdom',currency:'GBP'\}/);
  assert.doesNotMatch(feed, /AZ:\{country:'Azerbaijan'/);
  assert.match(feed, /product\.identifierExists === false/);
  assert.ok(feed.includes('<g:identifier_exists>no</g:identifier_exists>'));
  assert.match(feed, /market\.currency/);
  assert.match(feed, /variantCombinations/);
  assert.match(feed, /isValidGtin/);
  assert.doesNotMatch(feed, /free shipping|<g:shipping>/i);
});

test('country query parameter takes precedence over stored market in shared product links', async () => {
  const script = await read('public/script.js');
  assert.match(script, /queryCountry/);
  assert.match(script, /\['US','CA','UK','AZ'\]\.includes\(queryCountry\)/);
});

test('GA4 funnel includes shipping and payment information and maintains idempotent paid purchase', async () => {
  const script = await read('public/script.js');
  const growth = await read('public/growth.js');
  const analytics = await read('public/analytics.js');
  assert.match(script, /track\('begin_checkout'/);
  assert.match(script, /track\('add_shipping_info'/);
  assert.match(script, /track\('add_payment_info'/);
  assert.match(growth, /track\('view_item'/);
  assert.match(growth, /track\('view_item_list'/);
  assert.match(growth, /track\('add_to_cart'/);
  assert.match(analytics, /transport_type:\s*'beacon'/);
  assert.match(analytics, /dg_purchase_sent_/);
  assert.match(analytics, /transaction_id/);
  assert.match(script, /order\?\.paymentStatus\s*===\s*['"]Paid['"]/);
});

test('product images reserve aspect ratio to reduce layout shifts', async () => {
  const css = await read('public/style.css');
  const script = await read('public/script.js');
  assert.match(css, /\.product-image-wrap\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
  assert.match(script, /loading="lazy"/);
});

test('core payment, order and admin routes remain available', async () => {
  const server = await read('server.js');
  const script = await read('public/script.js');
  for (const route of ['/api/payment/create','/api/payment/callback','/api/orders','/api/admin/products']) {
    assert.ok(server.includes(route), 'Missing core route: ' + route);
  }
  assert.match(server, /createEpointPayment\(/);
  assert.match(server, /await db\.write\(\)/);
  assert.match(script, /payment\.redirect_url/);
  assert.match(script, /dg_checkout_mode/);
});


test('admin supports only supplier-confirmed products without assigned manufacturer identifiers', async () => {
  const server = await read('server.js');
  const admin = await read('public/admin.html');
  assert.ok(server.includes('identifierExists: z.boolean().optional()'));
  assert.ok(server.includes('identifierExists: parsed.data.identifierExists === false ? false : null'));
  assert.ok(admin.includes('id="productIdentifierMissing"'));
  assert.ok(admin.includes("identifierExists:$('productIdentifierMissing').checked ? false : null"));
  assert.ok(admin.includes("$('productIdentifierMissing').checked=p.identifierExists===false"));
});


test('checkout displays an itemised market-currency total and refreshes it when country changes', async () => {
  const script = await read('public/script.js');
  assert.ok(script.includes('id="checkoutOrderSummary"'));
  assert.ok(script.includes('function renderCheckoutOrderSummary()'));
  assert.ok(script.includes("renderCheckoutOrderSummary();"));
  assert.ok(script.includes("const currency = ({US:'USD',CA:'CAD',UK:'GBP',AZ:'AZN'})[code]"));
  assert.ok(script.includes('checkoutTotal'));
  assert.ok(script.includes('button.disabled = true'));
});

test('customer order tracking exposes only validated HTTPS carrier links entered by admin', async () => {
  const server = await read('server.js');
  const admin = await read('public/admin.html');
  const script = await read('public/script.js');
  assert.ok(server.includes('trackingUrl: z.string().trim().url().max(1000).nullable().optional()'));
  assert.ok(server.includes('trackingUrl: order.trackingUrl || null'));
  assert.ok(admin.includes('id="tu-${esc(o.id)}"'));
  assert.ok(admin.includes('Carrier tracking URL (https://…'));
  assert.ok(admin.includes('trackingUrl:trackingUrl||null'));
  assert.ok(script.includes('const safeTrackingUrl = /^https:\\/\\//i.test(String(order.trackingUrl || ''))'));
  assert.ok(script.includes('Track with carrier'));
});

test('checkout summary styling remains responsive and does not alter existing storefront layout rules', async () => {
  const css = await read('public/style.css');
  assert.ok(css.includes('.checkout-order-summary'));
  assert.ok(css.includes('@media (max-width: 520px)'));
  assert.ok(css.includes('.checkout-order-line'));
});
