import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createDatabase } from './database.js';
import { isValidGtin } from './lib/gtin.js';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const EPOINT_PUBLIC_KEY = process.env.EPOINT_PUBLIC_KEY || '';
const EPOINT_PRIVATE_KEY = process.env.EPOINT_PRIVATE_KEY || '';
const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL || `http://localhost:${PORT}`;
// Public identifiers and optional email delivery settings. Never expose provider secrets.
const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID || '').trim();
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.PAYMENT_BASE_URL || 'https://dreamgrind.store').replace(/\/+$/, '');
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';
const CART_RECOVERY_ENABLED = Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);
// Azerbaijan checkout is enabled by default. Set AZERBAIJAN_CHECKOUT_ENABLED=false only for an emergency pause.
const AZERBAIJAN_CHECKOUT_ENABLED = process.env.AZERBAIJAN_CHECKOUT_ENABLED !== 'false';
const USD_TO_AZN = 1.70;
function effectiveProductPrice(product, now = Date.now()) {
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  if (compareAt > current && product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return compareAt;
  }
  return current;
}
function normalizeVariantValue(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en-US');
}
function findVariantCombination(product, color, size) {
  const variants = Array.isArray(product?.variantCombinations) ? product.variantCombinations : [];
  return variants.find(variant => normalizeVariantValue(variant.color) === normalizeVariantValue(color)
    && normalizeVariantValue(variant.size) === normalizeVariantValue(size)) || null;
}
function effectiveVariantPrice(product, variant, now = Date.now()) {
  if (!variant) return effectiveProductPrice(product, now);
  const current = Number(product?.price || 0);
  const compareAt = Number(product?.oldPrice || 0);
  const variantPrice = Number(variant.price || 0);
  if (compareAt > current && current > 0 && product?.saleEndsAt) {
    const end = Date.parse(product.saleEndsAt);
    if (Number.isFinite(end) && end <= now) return Number((variantPrice * compareAt / current).toFixed(2));
  }
  return Number(variantPrice.toFixed(2));
}

// Market prices are stored in their local currencies. Epoint checkout settles in AZN.
const CURRENCY_TO_AZN = { US: USD_TO_AZN, CA: USD_TO_AZN / 1.36, UK: USD_TO_AZN / 0.75, AZ: 1 };
function countryCodeFromName(country) {
  if (country === 'Canada') return 'CA';
  if (country === 'United Kingdom') return 'UK';
  if (country === 'Azerbaijan') return 'AZ';
  return 'US';
}

// Checkout receives the national part from the browser and stores one canonical E.164 number.
function normalizePhoneForCountry(country, value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (country === 'Azerbaijan') {
    if (digits.startsWith('994')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return /^\d{9}$/.test(digits) ? `+994${digits}` : null;
  }

  if (country === 'United States' || country === 'Canada') {
    if (digits.startsWith('1') && digits.length === 11) digits = digits.slice(1);
    return /^\d{10}$/.test(digits) ? `+1${digits}` : null;
  }

  if (country === 'United Kingdom') {
    if (digits.startsWith('44')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return /^\d{9,10}$/.test(digits) ? `+44${digits}` : null;
  }

  return null;
}
function isProductAvailableForCountry(product, country) {
  const code = countryCodeFromName(country);
  if (code === 'AZ') return product?.availabilityByCountry?.AZ === true && Number(product?.countryPrices?.AZ) > 0;
  return product?.availabilityByCountry?.[code] !== false;
}
function effectiveProductPriceForCountry(product, country, now = Date.now()) {
  const code = countryCodeFromName(country);
  const usdAmount = effectiveProductPrice(product, now);
  if (code === 'US') return usdAmount;
  const configured = Number(product?.countryPrices?.[code]);
  // Azerbaijan's Admin-entered final AZN price is the exact customer price.
  if (code === 'AZ') return Number.isFinite(configured) && configured > 0 ? Number(configured.toFixed(2)) : 0;
  const baseUsd = Number(product?.price || 0);
  if (Number.isFinite(configured) && configured > 0 && baseUsd > 0) return Number((configured * usdAmount / baseUsd).toFixed(2));
  const rate = code === 'CA' ? 1.36 : 0.75;
  return Number((usdAmount * rate).toFixed(2));
}
function effectiveVariantPriceForCountry(product, variant, country, now = Date.now()) {
  const code = countryCodeFromName(country);
  const usdAmount = effectiveVariantPrice(product, variant, now);
  if (code === 'US') return usdAmount;
  const configured = Number(product?.countryPrices?.[code]);
  // Azerbaijan variants use the exact Admin-entered all-in AZN price too.
  if (code === 'AZ') return Number.isFinite(configured) && configured > 0 ? Number(configured.toFixed(2)) : 0;
  const baseUsd = Number(product?.price || 0);
  if (Number.isFinite(configured) && configured > 0 && baseUsd > 0) return Number((configured * usdAmount / baseUsd).toFixed(2));
  const rate = code === 'CA' ? 1.36 : 0.75;
  return Number((usdAmount * rate).toFixed(2));
}
function validateVariantCombinations(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const seen = new Set();
  for (const variant of variants) {
    const color = normalizeVariantValue(variant.color);
    const size = normalizeVariantValue(variant.size);
    if (!color && !size) return 'Each variant must include a color or a size.';
    const key = JSON.stringify([color, size]);
    if (seen.has(key)) return 'Each color/size combination must be unique.';
    seen.add(key);
  }
  const hasColor = variants.some(v => normalizeVariantValue(v.color));
  const hasNoColor = variants.some(v => !normalizeVariantValue(v.color));
  const hasSize = variants.some(v => normalizeVariantValue(v.size));
  const hasNoSize = variants.some(v => !normalizeVariantValue(v.size));
  if (hasColor && hasNoColor) return 'Use a color for every variant, or omit color for every variant.';
  if (hasSize && hasNoSize) return 'Use a size for every variant, or omit size for every variant.';
  return null;
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and at least 32 characters long.');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before starting.');
  process.exit(1);
}

const db = await createDatabase();
db.data.checkoutTokens ||= {};
db.data.orderTrackingTokens ||= {};
db.data.reviews ||= [];
db.data.cartRecoveries ||= [];

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use((req, res, next) => {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://epoint.az",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.unsplash.com",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://epoint.az",
    "font-src 'self' data:",
    "frame-src https://epoint.az",
    "upgrade-insecure-requests"
  ].join('; ');
  res.setHeader('Content-Security-Policy-Report-Only', policy);
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]));
}
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/
Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml
`);
});
app.get('/sitemap.xml', (_req, res) => {
  const urls = [`${PUBLIC_SITE_URL}/`];
  const markets = [
    { code: 'US', country: 'United States' },
    { code: 'CA', country: 'Canada' },
    { code: 'UK', country: 'United Kingdom' },
    { code: 'AZ', country: 'Azerbaijan' }
  ];
  for (const product of db.data.products) {
    if (!product || product.id == null) continue;
    for (const market of markets) {
      if (isProductAvailableForCountry(product, market.country) && effectiveProductPriceForCountry(product, market.country) > 0) {
        urls.push(`${PUBLIC_SITE_URL}/?product=${encodeURIComponent(product.id)}&country=${market.code}`);
      }
    }
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeXml(url)}</loc></url>`).join('')}</urlset>`;
  res.type('application/xml').set('Cache-Control', 'public, max-age=900').send(body);
});
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function renderProductLandingPage(product, countryCode) {
  const markets = { US:{country:'United States',currency:'USD',locale:'en-US'}, CA:{country:'Canada',currency:'CAD',locale:'en-CA'}, UK:{country:'United Kingdom',currency:'GBP',locale:'en-GB'}, AZ:{country:'Azerbaijan',currency:'AZN',locale:'az-AZ'} };
  const market = markets[countryCode] || markets.US;
  const available = isProductAvailableForCountry(product, market.country);
  const variants = Array.isArray(product.variantCombinations) ? product.variantCombinations : [];
  const prices = variants.length ? variants.map(v => effectiveVariantPriceForCountry(product,v,market.country)).filter(v => Number.isFinite(v) && v > 0) : [effectiveProductPriceForCountry(product,market.country)].filter(v => Number.isFinite(v) && v > 0);
  const price = prices.length ? Math.min(...prices) : 0;
  const images = (Array.isArray(product.images) ? product.images : []).concat(product.image || []).filter(value => { try { const parsed = new URL(String(value || '')); return parsed.protocol === 'http:' || parsed.protocol === 'https:'; } catch { return false; } }).slice(0,8);
  const image = images[0] || '';
  const title = String(product.title || 'DreamGrind product');
  const description = String(product.description || ('Explore ' + title + ' at DreamGrind.')).replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').trim().slice(0,300);
  const url = PUBLIC_SITE_URL + '/?product=' + encodeURIComponent(product.id) + '&country=' + countryCode;
  const priceText = price > 0 ? new Intl.NumberFormat(market.locale,{style:'currency',currency:market.currency}).format(price) : 'Unavailable';
  const inStock = available && Number(product.stock) > 0;
  const offer = { '@type': variants.length ? 'AggregateOffer' : 'Offer', url, priceCurrency:market.currency, ...(variants.length ? {lowPrice:Number(Math.min(...prices).toFixed(2)),highPrice:Number(Math.max(...prices).toFixed(2)),offerCount:prices.length} : {price:Number(price.toFixed(2))}), availability:inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' };
  const schema = { '@context':'https://schema.org', '@type':'Product', name:title, description, image:images, sku:String(product.id), offers:offer, ...(product.brand ? {brand:{'@type':'Brand',name:String(product.brand).slice(0,100)}} : {}), ...(isValidGtin(product.gtin) ? {gtin:String(product.gtin)} : {}), ...(product.mpn ? {mpn:String(product.mpn).slice(0,100)} : {}) };
  const breadcrumb = { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:PUBLIC_SITE_URL + '/'},{'@type':'ListItem',position:2,name:String(product.category || 'Shop'),item:PUBLIC_SITE_URL + '/#shop'},{'@type':'ListItem',position:3,name:title,item:url}] };
  const esc = escapeHtml;
  const gallery = images.map((src,i) => '<img src="' + esc(src) + '" alt="' + esc(title) + ' - image ' + (i+1) + '" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async" style="width:100%;max-width:520px;aspect-ratio:1/1;object-fit:contain">').join('');
  const head = '<!doctype html><html lang="' + (countryCode === 'AZ' ? 'az' : 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#071a2c"><title>' + esc(title) + ' | DreamGrind</title><meta name="description" content="' + esc(description) + '"><link rel="canonical" href="' + esc(url) + '"><meta property="og:type" content="product"><meta property="og:title" content="' + esc(title) + ' | DreamGrind"><meta property="og:description" content="' + esc(description) + '"><meta property="og:url" content="' + esc(url) + '">' + (image ? '<meta property="og:image" content="' + esc(image) + '">' : '') + '<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=20261127-edit-v1"><link rel="stylesheet" href="/dreamgrind-premium.css?v=20261127-center-v3"><link rel="stylesheet" href="/growth.css?v=20261127-edit-v1"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,'\\u003c') + '</script><script type="application/ld+json">' + JSON.stringify(breadcrumb).replace(/</g,'\\u003c') + '</script></head>';
  return head + '<body><main style="max-width:1180px;margin:32px auto;padding:24px"><a href="/">DreamGrind</a><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#shop">' + esc(product.category || 'Shop') + '</a> / ' + esc(title) + '</nav><article style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:32px;margin-top:28px"><div>' + gallery + '</div><div><p style="text-transform:uppercase;letter-spacing:.16em;color:#0b8984;font-size:11px;font-weight:800">' + esc(product.category || 'DreamGrind') + '</p><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p><p style="font-size:26px;font-weight:800">' + esc(priceText) + '</p><p>' + (inStock ? 'Available to order' : 'Currently unavailable') + '</p><p>Secure payment by Epoint. Delivery information is shown before checkout.</p><a href="/?product=' + encodeURIComponent(product.id) + '&country=' + countryCode + '" style="display:inline-flex;padding:14px 20px;border-radius:12px;background:#071a2c;color:white;text-decoration:none;font-weight:800">View product and buy</a></div></article></main><script>try{localStorage.setItem("dg_country",' + JSON.stringify(countryCode) + ')}catch(e){}</script></body></html>';
}
app.get('/', (req,res,next) => {
  if (req.query.product == null) return next();
  const id = Number(req.query.product);
  if (!Number.isInteger(id) || id < 1) return next();
  const product = db.data.products.find(item => Number(item.id) === id);
  if (!product) return next();
  const requested = String(req.query.country || 'US').toUpperCase();
  const country = ['US','CA','UK','AZ'].includes(requested) ? requested : 'US';
  res.set('Cache-Control','public, max-age=60, stale-while-revalidate=300').type('html').send(renderProductLandingPage(product,country));
});
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many checkout attempts. Please try again shortly.' } });
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many messages. Please try again later.' } });
const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many review attempts. Please try again later.' } });
const cartRecoveryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many cart reminder requests. Please try again later.' } });
const emailSchema = z.string().trim().email().max(254);
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(128)
});
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
const orderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().max(120).optional(),
region: z.string().trim().max(120).optional(),
province: z.string().trim().max(120).optional(),

zip: z.string().trim().max(30).optional(),
zipCode: z.string().trim().max(30).optional(),
postalCode: z.string().trim().max(30).optional(),
postal_code: z.string().trim().max(30).optional(),
  addressLine2: z.string().trim().max(180).optional(),
  deliveryNotes: z.string().trim().max(500).optional(),
  country: z.enum(['United States', 'Canada', 'United Kingdom', 'Azerbaijan']),
  items: z.array(z.object({ id: z.coerce.number().int().positive(), qty: z.coerce.number().int().min(1).max(20), variant: z.string().max(180).nullable().optional(), variantColor: z.string().trim().max(60).nullable().optional(), variantSize: z.string().trim().max(60).nullable().optional() })).min(1).max(50),
  redeemGrindPoints: z.coerce.number().int().min(0).max(10000000).optional()
}).superRefine((data, ctx) => {
  // A postal/ZIP code is required for every destination. Accept legacy field aliases,
  // but reject missing, whitespace-only, or implausibly short values server-side.
  const postalCode = [data.zip, data.zipCode, data.postalCode, data.postal_code]
    .map(value => String(value || '').trim())
    .find(value => value.length >= 2);
  if (!postalCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['zip'],
      message: 'Postal code is required.'
    });
  }
});
const messageSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: emailSchema.optional(),
  text: z.string().trim().min(1).max(2000)
});
function createEpointSignature(data) {
  if (!EPOINT_PRIVATE_KEY) {
    throw new Error('EPOINT_PRIVATE_KEY is not configured.');
  }

  return createHash('sha1')
    .update(EPOINT_PRIVATE_KEY + data + EPOINT_PRIVATE_KEY, 'utf8')
    .digest('base64');
}

function encodeEpointData(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}async function createEpointPayment({
  orderId,
  amount,
  description
}) {
  if (!EPOINT_PUBLIC_KEY || !EPOINT_PRIVATE_KEY) {
    throw new Error('Epoint keys are not configured yet.');
  }
  const payload = {
  public_key: EPOINT_PUBLIC_KEY,
  amount: Number(amount).toFixed(2),
  currency: 'AZN',
  language: 'en',
  order_id: String(orderId),
  description: description || `DreamGrind order ${orderId}`,
  success_redirect_url: `${PAYMENT_BASE_URL}/?payment=success&order_id=${encodeURIComponent(orderId)}`,
  error_redirect_url: `${PAYMENT_BASE_URL}/?payment=error&order_id=${encodeURIComponent(orderId)}`
};
  

  const data = encodeEpointData(payload);
  const signature = createEpointSignature(data);

  const response = await fetch('https://epoint.az/api/1/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      data,
      signature
    })
  });

  const result = await response.json();

  if (!response.ok || result.status !== 'success' || !result.redirect_url) {
    throw new Error(result.message || 'Epoint payment request failed.');
  }

  return result;
}
function signUser(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
function setSession(res, user) {
  res.cookie('dg_session', signUser(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}
const GRIND_POINTS_PER_AZN = 1;
const GRIND_POINTS_PER_AZN_REWARD = 100;
const GRIND_POINTS_MAX_REDEMPTION_RATE = 0.10;
function getGrindPointsBalance(user) {
  return Math.max(0, Math.floor(Number(user?.loyaltyPoints) || 0));
}
function restoreGrindPointsRedemption(order) {
  if (!order || !Number(order.loyaltyPointsRedeemed) || order.loyaltyPointsRedemptionRestoredAt) return;
  const user = order.userId ? db.data.users.find(item => item.id === order.userId) : null;
  if (user) user.loyaltyPoints = getGrindPointsBalance(user) + Math.max(0, Math.floor(Number(order.loyaltyPointsRedeemed) || 0));
  order.loyaltyPointsRefunded = Math.max(0, Math.floor(Number(order.loyaltyPointsRedeemed) || 0));
  order.loyaltyPointsRefundedAt = new Date().toISOString();
  order.loyaltyPointsRedemptionRestoredAt = new Date().toISOString();
}
function buildGrindPointsLedger(userId) {
  return (db.data.orders || []).filter(order => order.userId === userId).flatMap(order => {
    const entries = [];
    if (Number(order.loyaltyPointsEarned) > 0) entries.push({ id:order.id+':earned', orderId:order.id, type:'earned', points:Number(order.loyaltyPointsEarned), createdAt:order.loyaltyPointsAwardedAt || order.paymentUpdatedAt || order.createdAt });
    if (Number(order.loyaltyPointsRedeemed) > 0) entries.push({ id:order.id+':redeemed', orderId:order.id, type:'redeemed', points:-Number(order.loyaltyPointsRedeemed), createdAt:order.loyaltyPointsRedeemedAt || order.createdAt });
    if (Number(order.loyaltyPointsRefunded) > 0) entries.push({ id:order.id+':refund', orderId:order.id, type:'refund', points:Number(order.loyaltyPointsRefunded), createdAt:order.loyaltyPointsRefundedAt || order.refundedAt || order.createdAt });
    if (order.loyaltyPointsReversedAt && Number(order.loyaltyPointsEarned)>0) entries.push({ id:order.id+':reversed', orderId:order.id, type:'reversed', points:-Number(order.loyaltyPointsEarned), createdAt:order.loyaltyPointsReversedAt });
    return entries;
  }).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
function applyGrindPointsRefund(order) {
  if (!order || order.loyaltyPointsRefundProcessedAt) return;
  const user = order.userId ? db.data.users.find(item => item.id === order.userId) : null;
  const earned = Math.max(0, Math.floor(Number(order.loyaltyPointsEarned) || 0));
  if (user && earned > 0) user.loyaltyPoints = Math.max(0, getGrindPointsBalance(user) - earned);
  restoreGrindPointsRedemption(order);
  if (earned > 0) order.loyaltyPointsReversedAt = new Date().toISOString();
  order.loyaltyPointsRefundProcessedAt = new Date().toISOString();
}
function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, loyaltyPoints: getGrindPointsBalance(user), loyaltyPointsValueAzn: Number((getGrindPointsBalance(user) / GRIND_POINTS_PER_AZN_REWARD).toFixed(2)) };
}
function getSessionUser(req) {
  const token = req.cookies.dg_session;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return db.data.users.find(u => u.id === payload.sub) || null;
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required.' });
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.user = user;
  next();
}
function nextId(prefix, collection) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}
async function ensureProducts() {
  if (process.env.DATABASE_URL) return;
  db.data.products = [
    { id: 1, title: 'Mini LED Ceiling Fan', price: 29.99 },
    { id: 2, title: 'Portable Desk Vacuum', price: 19.99 },
    { id: 3, title: 'Interactive Pet Ball', price: 24.99 },
    { id: 4, title: 'Travel Organizer Pouch', price: 21.99 },
    { id: 5, title: 'Foldable Phone Stand', price: 15.99 },
    { id: 6, title: 'Kitchen Storage Box', price: 17.49 },
    { id: 7, title: 'Pet Grooming Glove', price: 11.99 },
    { id: 8, title: 'Smart Cable Organizer', price: 12.99 }
  ];
  await db.write();
}
async function ensureAdmin() {
  const existing = db.data.users.find(u => u.email === ADMIN_EMAIL);
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    db.data.users.push({ id: nextId('USR', db.data.users), name: 'DreamGrind Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin', createdAt: new Date().toISOString() });
    await db.write();
    return;
  }
  if (existing.role !== 'admin') {
    existing.role = 'admin';
    await db.write();
  }
}
await ensureProducts();
// Keep Azerbaijan listings safe: only products with an explicitly entered final AZN price may be sold.
// Existing catalogue and product records are preserved; unpriced AZ items are hidden until configured in Admin.
let azMarketMigrationChanged = false;
for (const product of db.data.products) {
  product.availabilityByCountry ||= {};
  product.countryPrices ||= {};
  if (!(Number(product.countryPrices.AZ) > 0) && product.availabilityByCountry.AZ !== false) {
    product.availabilityByCountry.AZ = false;
    azMarketMigrationChanged = true;
  }
}
if (azMarketMigrationChanged) await db.write();
await ensureAdmin();

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dreamgrind-api' }));
app.get('/api/store-config', (_req, res) => res.set('Cache-Control', 'no-store').json({
  azerbaijanCheckoutEnabled: AZERBAIJAN_CHECKOUT_ENABLED,
  azerbaijanShippingQuoteRequired: false,
  analyticsMeasurementId: GA_MEASUREMENT_ID,
  cartRecoveryEnabled: CART_RECOVERY_ENABLED,
  publicSiteUrl: PUBLIC_SITE_URL
}));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check your name, email and password.' });
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  if (db.data.users.some(u => u.email === normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = { id: nextId('USR', db.data.users), name, email: normalizedEmail, passwordHash, role: 'customer', loyaltyPoints: 0, createdAt: new Date().toISOString() };
  db.data.users.push(user);
  await db.write();
  setSession(res, user);
  res.status(201).json({ user: sanitizeUser(user) });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid login details.' });
  const { email, password } = parsed.data;
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  setSession(res, user);
  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('dg_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ user: user ? sanitizeUser(user) : null });
});

app.get('/api/loyalty/me', requireAuth, (req, res) => {
  const points = getGrindPointsBalance(req.user);
  res.set('Cache-Control','no-store');
  res.json({ balance:points, valueAzn:Number((points/GRIND_POINTS_PER_AZN_REWARD).toFixed(2)), rules:{earnPerAzn:GRIND_POINTS_PER_AZN,pointsPerAzn:GRIND_POINTS_PER_AZN_REWARD,maxRedemptionRate:GRIND_POINTS_MAX_REDEMPTION_RATE}, history:buildGrindPointsLedger(req.user.id) });
});

app.get('/api/products', (_req, res) => {
  const paidOrders = db.data.orders.filter(order => order.paymentStatus === 'Paid');
  const sold = new Map();
  for (const order of paidOrders) {
    for (const item of (Array.isArray(order.items) ? order.items : [])) {
      const id = Number(item.id);
      if (Number.isInteger(id)) sold.set(id, (sold.get(id) || 0) + Math.max(0, Number(item.qty) || 0));
    }
  }
  const reviewStats = new Map();
  for (const review of (db.data.reviews || []).filter(item => item.verifiedPurchase === true)) {
    const bucket = reviewStats.get(Number(review.productId)) || { sum: 0, count: 0 };
    bucket.sum += Number(review.rating) || 0;
    bucket.count += 1;
    reviewStats.set(Number(review.productId), bucket);
  }
  res.set('Cache-Control', 'no-store').json({ products: db.data.products.map(product => {
    const stats = reviewStats.get(Number(product.id));
    return {
      ...product,
      unitsSold: sold.get(Number(product.id)) || 0,
      rating: stats?.count ? Number((stats.sum / stats.count).toFixed(1)) : null,
      reviews: stats?.count || 0
    };
  }) });
});

app.get('/feed/google.xml', (req, res) => {
  const code = String(req.query.country || 'US').toUpperCase();
  const markets = { US:{country:'United States',currency:'USD'}, CA:{country:'Canada',currency:'CAD'}, UK:{country:'United Kingdom',currency:'GBP'} };
  const market = markets[code];
  if (!market) return res.status(400).type('text/plain').send('Unsupported Google Shopping target country.');
  const items = db.data.products.filter(product => isProductAvailableForCountry(product, market.country)).map(product => {
    const images = (Array.isArray(product.images) ? product.images : []).concat(product.image || []).filter(url => { try { const parsed = new URL(String(url || '')); return parsed.protocol === 'http:' || parsed.protocol === 'https:'; } catch { return false; } });
    const gtinValid = isValidGtin(product.gtin);
    const mpn = String(product.mpn || '').trim();
    const brand = String(product.brand || '').trim();
    const identifierMissingConfirmed = product.identifierExists === false;
    const stock = Number(product.stock);
    if (!images.length || !(stock > 0) || (!gtinValid && !(mpn && brand) && !identifierMissingConfirmed)) return null;
    const variants = Array.isArray(product.variantCombinations) ? product.variantCombinations : [];
    const rows = variants.length ? variants : [null];
    return rows.map(variant => {
      const price = variant ? effectiveVariantPriceForCountry(product, variant, market.country) : effectiveProductPriceForCountry(product, market.country);
      if (!(Number.isFinite(price) && price > 0)) return null;
      const variantText = variant ? [variant.color, variant.size].filter(Boolean).join(' / ') : '';
      const suffix = variant ? '-' + Buffer.from([variant.color || '', variant.size || ''].join('|')).toString('base64url').slice(0,24) : '';
      const itemId = String(product.id) + suffix;
      const title = variantText ? String(product.title || '') + ' - ' + variantText : String(product.title || '');
      const description = String(product.description || product.title || '').replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').trim().slice(0,4500);
      const url = PUBLIC_SITE_URL + '/?product=' + encodeURIComponent(product.id) + '&country=' + code;
      const identifier = gtinValid ? '<g:gtin>' + escapeXml(product.gtin) + '</g:gtin>' : (mpn && brand ? '<g:mpn>' + escapeXml(mpn) + '</g:mpn>' : '<g:identifier_exists>no</g:identifier_exists>');
      const brandAttribute = brand ? '<g:brand>' + escapeXml(brand) + '</g:brand>' : '';
      const attrs = variant ? (variant.color ? '<g:color>' + escapeXml(variant.color) + '</g:color>' : '') + (variant.size ? '<g:size>' + escapeXml(variant.size) + '</g:size>' : '') : '';
      const group = variants.length ? '<g:item_group_id>' + escapeXml(product.id) + '</g:item_group_id>' : '';
      return '<item><g:id>' + escapeXml(itemId) + '</g:id><g:title>' + escapeXml(title) + '</g:title><g:description>' + escapeXml(description) + '</g:description><g:link>' + escapeXml(url) + '</g:link><g:image_link>' + escapeXml(images[0]) + '</g:image_link>' + images.slice(1,10).map(image => '<g:additional_image_link>' + escapeXml(image) + '</g:additional_image_link>').join('') + '<g:availability>in_stock</g:availability><g:condition>new</g:condition><g:price>' + price.toFixed(2) + ' ' + market.currency + '</g:price>' + brandAttribute + identifier + attrs + group + '</item>';
    }).filter(Boolean).join('');
  }).filter(Boolean);
  const xml = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>DreamGrind ' + code + '</title><link>' + escapeXml(PUBLIC_SITE_URL) + '</link><description>DreamGrind product feed for ' + market.country + '</description>' + items.join('') + '</channel></rss>';
  res.type('application/xml').set('Cache-Control','public, max-age=900').send(xml);
});
app.get('/api/reviews/:productId', (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1) return res.status(400).json({ error: 'Invalid product.' });
  const reviews = (db.data.reviews || []).filter(review => Number(review.productId) === productId && review.verifiedPurchase === true)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50)
    .map(review => ({ id: review.id, rating: review.rating, title: review.title, text: review.text, customerName: review.customerName, verifiedPurchase: true, createdAt: review.createdAt }));
  res.set('Cache-Control', 'no-store').json({ reviews });
});

app.post('/api/reviews', reviewLimiter, async (req, res) => {
  const schema = z.object({
    productId: z.coerce.number().int().positive(),
    orderId: z.string().trim().min(5).max(40),
    email: emailSchema,
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(100).optional().default(''),
    text: z.string().trim().min(10).max(1500)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter your order number, checkout email, a 1–5 star rating and a review of at least 10 characters.' });
  const { productId, orderId, email, rating, title, text: reviewText } = parsed.data;
  const product = db.data.products.find(item => Number(item.id) === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const order = db.data.orders.find(item => String(item.id).toUpperCase() === orderId.toUpperCase() && String(item.email || '').toLowerCase() === email.toLowerCase() && item.paymentStatus === 'Paid');
  if (!order || !(Array.isArray(order.items) ? order.items : []).some(item => Number(item.id) === productId)) {
    return res.status(403).json({ error: 'We could not verify a paid purchase of this product with those order details.' });
  }
  if ((db.data.reviews || []).some(review => String(review.orderId).toUpperCase() === order.id.toUpperCase() && Number(review.productId) === productId)) {
    return res.status(409).json({ error: 'A review for this product has already been submitted for this order.' });
  }
  const review = {
    id: nextId('REV', db.data.reviews), productId, orderId: order.id, rating, title, text: reviewText,
    customerName: String(order.name || 'Customer').trim().split(/\s+/)[0].slice(0, 40),
    verifiedPurchase: true, createdAt: new Date().toISOString()
  };
  db.data.reviews.unshift(review);
  await db.write();
  res.status(201).json({ ok: true, review: { id: review.id, rating: review.rating, title: review.title, text: review.text, customerName: review.customerName, verifiedPurchase: true, createdAt: review.createdAt } });
});

app.post('/api/cart-recovery', cartRecoveryLimiter, async (req, res) => {
  if (!CART_RECOVERY_ENABLED) return res.status(503).json({ error: 'Cart reminders are not configured yet.' });
  const schema = z.object({
    email: emailSchema, consent: z.literal(true),
    country: z.enum(['United States', 'Canada', 'United Kingdom', 'Azerbaijan']),
    items: z.array(z.object({ id: z.coerce.number().int().positive(), qty: z.coerce.number().int().min(1).max(20), variantColor: z.string().trim().max(60).nullable().optional(), variantSize: z.string().trim().max(60).nullable().optional() })).min(1).max(12)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the reminder details.' });
  const { email, country, items } = parsed.data;
  const summary = [];
  for (const item of items) {
    const product = db.data.products.find(p => Number(p.id) === item.id);
    if (!product || !isProductAvailableForCountry(product, country)) continue;
    const hasVariants = Array.isArray(product.variantCombinations) && product.variantCombinations.length > 0;
    const variant = hasVariants ? findVariantCombination(product, item.variantColor, item.variantSize) : null;
    if (hasVariants && !variant) continue;
    const price = variant ? effectiveVariantPriceForCountry(product, variant, country) : effectiveProductPriceForCountry(product, country);
    summary.push({ id: product.id, title: String(product.title || 'DreamGrind product').slice(0, 160), qty: item.qty, price: Number(price.toFixed(2)), url: `${PUBLIC_SITE_URL}/?product=${encodeURIComponent(product.id)}` });
  }
  if (!summary.length) return res.status(400).json({ error: 'No available products were found in this cart.' });
  const token = randomBytes(24).toString('hex');
  const normalizedEmail = email.toLowerCase();
  let record = (db.data.cartRecoveries || []).find(item => item.email === normalizedEmail && item.status === 'pending');
  if (!record) {
    record = { id: nextId('CAR', db.data.cartRecoveries), email: normalizedEmail, createdAt: new Date().toISOString(), status: 'pending', attempts: 0 };
    db.data.cartRecoveries.unshift(record);
  }
  record.country = country;
  record.items = summary;
  record.createdAt = new Date().toISOString();
  record.unsubscribeTokenHash = createHash('sha256').update(token).digest('hex');
  record.cancelTokenHash = createHash('sha256').update(token).digest('hex');
  record.consentAt = new Date().toISOString();
  record.lastAttemptAt = null;
  await db.write();
  res.status(202).json({ ok: true, cancelToken: token });
});

app.post('/api/cart-recovery/cancel', async (req, res) => {
  const parsed = z.object({ email: emailSchema, token: z.string().length(48) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid reminder preference.' });
  const hash = createHash('sha256').update(parsed.data.token).digest('hex');
  const record = (db.data.cartRecoveries || []).find(item => item.email === parsed.data.email.toLowerCase() && item.cancelTokenHash === hash && item.status === 'pending');
  if (record) { record.status = 'cancelled'; record.cancelledAt = new Date().toISOString(); await db.write(); }
  res.json({ ok: true });
});

app.get('/api/cart-recovery/unsubscribe/:token', async (req, res) => {
  const tokenHash = createHash('sha256').update(String(req.params.token || '')).digest('hex');
  const record = (db.data.cartRecoveries || []).find(item => item.unsubscribeTokenHash === tokenHash);
  if (record) { record.status = 'unsubscribed'; record.unsubscribedAt = new Date().toISOString(); await db.write(); }
  res.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DreamGrind email preferences</title><body style="font:16px system-ui;max-width:620px;margin:12vh auto;padding:24px;color:#17324a"><h1>Email reminders turned off</h1><p>You will not receive further DreamGrind abandoned-cart reminders at this address.</p><a href="/">Return to DreamGrind</a></body></html>');
});

app.post('/api/newsletter', contactLimiter, async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email.' });
  const email = parsed.data.email.toLowerCase();
  if (!db.data.newsletter.some(x => x.email === email)) db.data.newsletter.push({ email, createdAt: new Date().toISOString() });
  await db.write();
  res.status(201).json({ ok: true });
});

app.post('/api/orders', orderLimiter, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order details.' });
 const {
  name,
  email,
  phone,
  address,
  city,
  country,
  state,
  region,
  province,
  zip,
  zipCode,
  postalCode,
  postal_code,
  items,
  addressLine2,
  deliveryNotes
} = parsed.data;
  if (country === 'Azerbaijan' && !AZERBAIJAN_CHECKOUT_ENABLED) {
    return res.status(403).json({ error: 'Azerbaijan checkout is temporarily paused. Please contact DreamGrind.' });
  }
  const normalizedCustomerPhone = normalizePhoneForCountry(country, phone);
  if (!normalizedCustomerPhone) {
    const phoneError = country === 'Azerbaijan'
      ? 'Enter 9 Azerbaijan mobile digits. A leading 0 is optional; +994 is added automatically.'
      : country === 'United Kingdom'
        ? 'Enter 9 or 10 UK phone digits. A leading 0 is optional; +44 is added automatically.'
        : 'Enter a 10-digit US or Canadian phone number. +1 is added automatically.';
    return res.status(400).json({ error: phoneError });
  }
  if (country === 'Azerbaijan' && !String(state || region || province || '').trim()) {
    return res.status(400).json({ error: 'Enter the rayon or administrative area for the Azerbaijan delivery address.' });
  }
  const currentUser = getSessionUser(req);
  const checkoutToken = randomBytes(32).toString('hex');
  const productMap = new Map(db.data.products.map(p => [p.id, p]));
  const normalizedItems = [];
  for (const item of items) {
    const p = productMap.get(item.id);
    if (!p) return res.status(400).json({ error: 'One of the selected products is no longer available.' });
    if (!isProductAvailableForCountry(p, country)) {
      return res.status(400).json({ error: `“${p.title}” is not available for delivery to ${country}. Please remove it from your cart.` });
    }
    const combinations = Array.isArray(p.variantCombinations) ? p.variantCombinations : [];
    let selectedCombination = null;
    if (combinations.length) {
      selectedCombination = findVariantCombination(p, item.variantColor, item.variantSize);
      if (!selectedCombination) {
        return res.status(400).json({ error: `Please choose a valid color and size for “${p.title}”.` });
      }
    } else if (item.variantColor || item.variantSize) {
      return res.status(400).json({ error: `The options for “${p.title}” have changed. Please add it to your cart again.` });
    }
    const variantLabel = selectedCombination
      ? [selectedCombination.color ? `Color: ${selectedCombination.color}` : '', selectedCombination.size ? `Size: ${selectedCombination.size}` : ''].filter(Boolean).join(' · ')
      : (item.variant ?? null);
    const countryCode = countryCodeFromName(country);
    const unitPriceLocal = selectedCombination
      ? effectiveVariantPriceForCountry(p, selectedCombination, country)
      : effectiveProductPriceForCountry(p, country);
    const unitPriceAzn = unitPriceLocal * CURRENCY_TO_AZN[countryCode];
    normalizedItems.push({
      id: p.id,
      title: p.title,
      unitPrice: Number(unitPriceAzn.toFixed(2)), // Epoint settlement amount, in AZN
      marketUnitPrice: Number(unitPriceLocal.toFixed(2)),
      qty: item.qty,
      variant: variantLabel,
      variantColor: selectedCombination?.color ?? null,
      variantSize: selectedCombination?.size ?? null
    });
  }
  const grossSubtotalAzn = Number(normalizedItems.reduce((s, x) => s + x.unitPrice * x.qty, 0).toFixed(2));
  const requestedPoints = currentUser ? Math.max(0, Math.floor(Number(parsed.data.redeemGrindPoints) || 0)) : 0;
  const availablePoints = currentUser ? getGrindPointsBalance(currentUser) : 0;
  const maxPointsByOrder = Math.floor(grossSubtotalAzn * GRIND_POINTS_MAX_REDEMPTION_RATE * GRIND_POINTS_PER_AZN_REWARD + 1e-8);
  const redeemedPoints = Math.min(requestedPoints, availablePoints, maxPointsByOrder);
  const loyaltyDiscountAzn = Number((redeemedPoints / GRIND_POINTS_PER_AZN_REWARD).toFixed(2));
  const subtotal = Number(Math.max(0, grossSubtotalAzn - loyaltyDiscountAzn).toFixed(2));
  const orderCountryCode = countryCodeFromName(country);
  const grossMarketSubtotal = Number(normalizedItems.reduce((s, x) => s + x.marketUnitPrice * x.qty, 0).toFixed(2));
  const marketDiscount = loyaltyDiscountAzn / (CURRENCY_TO_AZN[orderCountryCode] || 1);
  const marketSubtotal = Number(Math.max(0, grossMarketSubtotal - marketDiscount).toFixed(2));
  const marketCurrency = ({ US: 'USD', CA: 'CAD', UK: 'GBP', AZ: 'AZN' })[orderCountryCode];
  // Azerbaijan's confirmed delivery/tax costs are already built into the product's final AZN price.
  // Keep a zero shipping line at checkout to avoid charging the customer twice.
  const shipping = 0;
  const trackingToken = randomBytes(32).toString('hex');
  const trackingTokenHash = createHash('sha256').update(trackingToken).digest('hex');
  const order = {
    id: nextId('DG', db.data.orders),
    userId: currentUser?.id ?? null,
    createdAt: new Date().toISOString(),
    status: 'Awaiting payment',
    paymentStatus: 'Pending',
    trackingNumber: null,
    name,
    email: email.toLowerCase(),
    phone: normalizedCustomerPhone,
    address,
    addressLine2: addressLine2 || '',
    deliveryNotes: deliveryNotes || '',
    city,
    state: state || region || province || '',
    zip: zip || zipCode || postalCode || postal_code || '',
    country,
    marketCurrency,
    marketSubtotal,
    marketTotal: Number((marketSubtotal + shipping).toFixed(2)),
    grossSubtotalAzn,
    loyaltyPointsRedeemed: redeemedPoints,
    loyaltyDiscountAzn,
    loyaltyPointsRedeemedAt: redeemedPoints > 0 ? new Date().toISOString() : null,
    currency: 'AZN',
    items: normalizedItems,
    subtotal,
    shipping,
    total: Number((subtotal + shipping).toFixed(2)),
    shippingQuoteRequired: false,
    checkoutExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
  if (redeemedPoints > 0 && currentUser) currentUser.loyaltyPoints = getGrindPointsBalance(currentUser) - redeemedPoints;
  db.data.orders.unshift(order);
  db.data.orderTrackingTokens[order.id] = {
    hash: trackingTokenHash,
    createdAt: new Date().toISOString(),
    // Used as a fallback if a legacy checkout token record is unavailable.
    expiresAt: Date.now() + 30 * 60 * 1000
  };
  db.data.checkoutTokens[order.id] = {
    hash: createHash('sha256').update(checkoutToken).digest('hex'),
    expiresAt: Date.now() + 30 * 60 * 1000
  };
  await db.write();
  res.status(201).json({
    order: { id: order.id, status: order.status, createdAt: order.createdAt, total: order.total, subtotal: order.subtotal, loyaltyPointsRedeemed: order.loyaltyPointsRedeemed, loyaltyDiscountAzn: order.loyaltyDiscountAzn },
    requiresShippingQuote: false,
    checkoutToken,
    trackingToken
  });
});
app.post('/api/payment/create', orderLimiter, async (req, res) => {
  const parsed = z.object({
    orderId: z.string().trim().min(3),
    checkoutToken: z.string().length(64)
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const order = db.data.orders.find(o => o.id === parsed.data.orderId);
  // Keep old manual-quote orders compatible, but all new Azerbaijan orders use normal checkout.
  if (order?.country === 'Azerbaijan' && (order.shippingQuoteRequired === true || !Number.isFinite(Number(order.shipping)) || !(Number(order.total) > 0))) {
    return res.status(409).json({ error: 'This older Azerbaijan order still needs its delivery quote confirmed by Admin.' });
  }
  const tokenRecord = order ? db.data.checkoutTokens?.[order.id] : null;
  const submittedTokenHash = createHash('sha256').update(parsed.data.checkoutToken).digest('hex');

  // The random token authorizes payment for this order without requiring an account.
  if (!order || !tokenRecord || tokenRecord.expiresAt < Date.now() || tokenRecord.hash !== submittedTokenHash) {
    return res.status(404).json({ error: 'Checkout session expired. Please start checkout again.' });
  }

  if (!EPOINT_PUBLIC_KEY || !EPOINT_PRIVATE_KEY) {
    restoreGrindPointsRedemption(order);
    delete db.data.checkoutTokens[order.id];
    await db.write();
    return res.status(503).json({ error: 'Epoint payment is not configured yet.' });
  }

  try {
    const payment = await createEpointPayment({
      orderId: order.id,
      amount: order.total,
      description: `DreamGrind order ${order.id}`
    });

    res.json({
      ok: true,
      redirect_url: payment.redirect_url,
      transaction: payment.transaction || null
    });
  } catch (error) {
    console.error('EPOINT PAYMENT ERROR:', error);
    restoreGrindPointsRedemption(order);
    delete db.data.checkoutTokens[order.id];
    await db.write();
    res.status(502).json({ error: 'Unable to create payment.' });
  }
});
app.post('/api/payment/callback', async (req, res) => {
  const { data, signature } = req.body;

  if (!data || !signature) {
    return res.status(400).json({
      error: 'Missing payment callback data.'
    });
  }

  try {
    const expectedSignature = createEpointSignature(data);
    const expectedBytes = Buffer.from(expectedSignature, 'utf8');
    const receivedBytes = Buffer.from(String(signature), 'utf8');

    if (expectedBytes.length !== receivedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes)) {
      console.error('EPOINT CALLBACK: invalid signature');
      return res.status(400).json({ error: 'Invalid signature.' });
    }

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    if (!decoded || typeof decoded.order_id !== 'string' || typeof decoded.status !== 'string') {
      return res.status(400).json({ error: 'Invalid payment callback data.' });
    }

    const order = db.data.orders.find(o => o.id === decoded.order_id);
    if (!order) {
      console.error('EPOINT CALLBACK: order not found:', decoded.order_id);
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (decoded.status === 'success') {
      const callbackAmount = Number(decoded.amount);
      if (!Number.isFinite(callbackAmount) || Math.round(callbackAmount * 100) !== Math.round(Number(order.total) * 100)) {
        console.error('EPOINT CALLBACK: amount mismatch for order:', order.id);
        return res.status(400).json({ error: 'Payment amount does not match the order.' });
      }
      if (decoded.operation_code != null && String(decoded.operation_code) !== '100') {
        console.error('EPOINT CALLBACK: unexpected operation code for order:', order.id);
        return res.status(400).json({ error: 'Unexpected payment operation.' });
      }
      if (order.paymentStatus === 'Cancelled' || order.status === 'Cancelled') {
        return res.status(409).json({ error: 'This order was cancelled after its checkout expired. Please place a new order.' });
      }
      if (order.paymentStatus !== 'Refunded') {
        const wasAlreadyPaid = order.paymentStatus === 'Paid';
        order.status = 'Processing';
        order.paymentStatus = 'Paid';
        order.paymentTransaction = decoded.transaction || null;
        order.paymentAmount = callbackAmount;
        order.paymentUpdatedAt = new Date().toISOString();
        if (!wasAlreadyPaid && order.userId && !order.loyaltyPointsAwardedAt) {
          const customer = db.data.users.find(user => user.id === order.userId);
          const grossAzn = Number(order.grossSubtotalAzn ?? (Number(order.marketTotal ?? order.total) * (CURRENCY_TO_AZN[countryCodeFromName(order.country)] || 1))) || 0;
          const netAzn = Math.max(0, grossAzn - (Number(order.loyaltyDiscountAzn) || 0));
          const points = Math.max(0, Math.floor(netAzn * GRIND_POINTS_PER_AZN));
          if (customer && points > 0) { customer.loyaltyPoints = getGrindPointsBalance(customer) + points; order.loyaltyPointsEarned = points; order.loyaltyPointsAwardedAt = new Date().toISOString(); }
        }
        for (const recovery of (db.data.cartRecoveries || [])) { if (recovery.email === String(order.email || '').toLowerCase() && recovery.status === 'pending') recovery.status = 'recovered'; }
        if (db.data.checkoutTokens) delete db.data.checkoutTokens[order.id];
      }
    } else if (decoded.status === 'returned') {
      order.status = 'Refunded';
      order.paymentStatus = 'Refunded';
      order.refundedAt = new Date().toISOString();
      order.paymentTransaction = decoded.transaction || order.paymentTransaction || null;
      order.paymentUpdatedAt = new Date().toISOString();
      applyGrindPointsRefund(order);
      if (db.data.checkoutTokens) delete db.data.checkoutTokens[order.id];
    } else if (['failed', 'error', 'server_error'].includes(decoded.status)) {
      // A delayed failure callback must never overwrite an already confirmed payment.
      if (!['Paid', 'Refunded'].includes(order.paymentStatus)) {
        restoreGrindPointsRedemption(order);
        order.paymentStatus = 'Failed';
        order.status = 'Awaiting payment';
        order.paymentTransaction = decoded.transaction || null;
        order.paymentUpdatedAt = new Date().toISOString();
        order.paymentError = decoded.message || decoded.bank_response || 'Payment failed.';
      }
    } else if (decoded.status !== 'new') {
      return res.status(400).json({ error: 'Unsupported payment status.' });
    }

    await db.write();
    console.log('EPOINT CALLBACK:', order.id, decoded.status, decoded.transaction || '');
    return res.json({ ok: true });
  } catch (error) {
    console.error('EPOINT CALLBACK ERROR:', error);
    return res.status(400).json({
      error: 'Invalid payment callback.'
    });
  }
});
app.get('/api/orders/me', requireAuth, (req, res) => {
  const orders = db.data.orders.filter(o => o.userId === req.user.id);
  res.set('Cache-Control', 'no-store');
  res.json({ orders });
});

app.post('/api/orders/track/:code', orderLimiter, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const order = db.data.orders.find(o => o.id === code);
  if (!order) {
    return res.status(404).json({ error: 'Order not found. Check the order number and try again.' });
  }

  const currentUser = getSessionUser(req);
  const isOwnerSession = Boolean(currentUser && order.userId && currentUser.id === order.userId);
  const submittedTrackingToken = typeof req.body?.trackingToken === 'string' ? req.body.trackingToken.trim() : '';
  const trackingRecord = db.data.orderTrackingTokens?.[order.id];
  const expectedTrackingHash = trackingRecord?.hash || null;
  const submittedTrackingHash = submittedTrackingToken
    ? createHash('sha256').update(submittedTrackingToken).digest('hex')
    : '';
  const validTrackingToken = Boolean(
    expectedTrackingHash &&
    submittedTrackingHash &&
    expectedTrackingHash.length === submittedTrackingHash.length &&
    timingSafeEqual(Buffer.from(expectedTrackingHash, 'hex'), Buffer.from(submittedTrackingHash, 'hex'))
  );
  const submittedEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const validEmailFallback = Boolean(
    submittedEmail &&
    order.email &&
    submittedEmail === String(order.email).trim().toLowerCase()
  );

  // Existing account owners may track their own orders. Guests must prove possession
  // of the one-time-secret tracking token or the checkout email address.
  if (!isOwnerSession && !validTrackingToken && !validEmailFallback) {
    return res.status(401).json({ error: 'Enter the checkout email address or use your private tracking link.' });
  }

  // Public tracking returns delivery/payment status only, never customer contact or address details.
  res.set('Cache-Control', 'no-store');
  return res.json({ order: {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber || null,
    trackingUrl: order.trackingUrl || null,
    total: order.total,
    currency: order.currency || 'AZN'
  } });
});

app.post('/api/messages', contactLimiter, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please enter a valid name, email and message.' });
  const user = getSessionUser(req);
  const name = parsed.data.name || user?.name || '';
  const email = (parsed.data.email || user?.email || '').toLowerCase();
  if (!user && (name.length < 2 || !email)) {
    return res.status(400).json({ error: 'Please enter your name and email address.' });
  }
  const message = {
    id: nextId('MSG', db.data.messages),
    userId: user?.id ?? null,
    name,
    email,
    text: parsed.data.text,
    from: 'customer',
    createdAt: new Date().toISOString()
  };
  db.data.messages.push(message);
  await db.write();
  res.status(201).json({ message: { id: message.id, text: message.text, createdAt: message.createdAt } });
});

app.get('/api/messages/me', requireAuth, (req, res) => {
  res.json({ messages: db.data.messages.filter(m => m.userId === req.user.id).map(m => ({ id: m.id, text: m.text, from: m.from, createdAt: m.createdAt })) });
});

app.get('/api/admin/summary', requireAdmin, (_req, res) => {
  const orders = db.data.orders.filter(order => order.paymentStatus === 'Paid');
const revenue = orders.reduce((s, o) => s + o.total, 0);

res.json({
  users: db.data.users.length,
  orders: db.data.orders.length,
  revenue,
  messages: db.data.messages.length,
  newsletter: db.data.newsletter?.length || 0
});
});
app.get('/api/admin/orders', requireAdmin, (_req, res) =>
  res.json({ orders: db.data.orders })
);
app.get('/api/admin/messages', requireAdmin, (_req, res) => res.json({ messages: db.data.messages }));
app.get('/api/admin/newsletter', requireAdmin, (_req, res) => res.json({ subscribers: db.data.newsletter || [] }));
app.get('/api/admin/users', requireAdmin, (_req, res) => res.json({ users: db.data.users.map(sanitizeUser) }));

const adminOrderUpdateSchema = z.object({
  status: z.enum(['Awaiting shipping quote', 'Awaiting payment', 'Processing', 'Shipped', 'In transit', 'Delivered', 'Cancelled', 'Refunded']),
  trackingNumber: z.string().trim().max(120).nullable().optional(),
  trackingUrl: z.string().trim().url().max(1000).nullable().optional()
});
const azShippingQuoteSchema = z.object({ shippingFeeAzn: z.number().finite().min(0).max(100000) });
app.post('/api/admin/orders/:id/payment-link', requireAdmin, async (req, res) => {
  const parsed = azShippingQuoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid Azerbaijan shipping fee in AZN.' });
  const order = db.data.orders.find(o => o.id === req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.country !== 'Azerbaijan') return res.status(400).json({ error: 'This payment-link action is only for Azerbaijan orders.' });
  if (['Paid', 'Refunded'].includes(order.paymentStatus) || order.status === 'Cancelled') return res.status(409).json({ error: 'This order has already been paid, refunded or cancelled.' });
  if (!EPOINT_PUBLIC_KEY || !EPOINT_PRIVATE_KEY) return res.status(503).json({ error: 'Epoint payment keys are not configured.' });

  const shippingFee = Number(parsed.data.shippingFeeAzn.toFixed(2));
  const total = Number((Number(order.subtotal || 0) + shippingFee).toFixed(2));
  if (!(total > 0)) return res.status(400).json({ error: 'The order total must be greater than zero.' });

  try {
    const payment = await createEpointPayment({ orderId: order.id, amount: total, description: `DreamGrind Azerbaijan order ${order.id}` });
    order.shipping = shippingFee;
    order.total = total;
    order.marketTotal = total;
    order.marketCurrency = 'AZN';
    order.currency = 'AZN';
    order.shippingQuoteRequired = false;
    order.shippingQuoteConfirmedAt = new Date().toISOString();
    order.paymentLinkCreatedAt = new Date().toISOString();
    order.status = 'Awaiting payment';
    order.paymentStatus = 'Pending';
    order.paymentLink = payment.redirect_url;
    await db.write();
    res.json({ ok: true, redirect_url: payment.redirect_url, subtotal: order.subtotal, shipping: shippingFee, total });
  } catch (error) {
    console.error('AZERBAIJAN PAYMENT LINK ERROR:', error);
    res.status(502).json({ error: 'Unable to create Epoint payment link.' });
  }
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const parsed = adminOrderUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order update.' });
  const order = db.data.orders.find(o => o.id === req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.status = parsed.data.status;
  if (parsed.data.trackingNumber !== undefined) order.trackingNumber = parsed.data.trackingNumber || null;
  if (parsed.data.trackingUrl !== undefined) order.trackingUrl = parsed.data.trackingUrl || null;
  if (parsed.data.status === 'Cancelled') restoreGrindPointsRedemption(order);
  if (parsed.data.status === 'Refunded') {
    order.paymentStatus = 'Refunded';
    order.refundedAt ||= new Date().toISOString();
    applyGrindPointsRefund(order);
  }
  await db.write();
  res.json({ order });
});

const adminProductSchema = z.object({
  title: z.string().trim().min(2).max(160),
  price: z.number().finite().positive().max(100000),
  oldPrice: z.number().finite().positive().max(100000).nullable().optional(),
  saleEndsAt: z.string().datetime().nullable().optional(),
  countryPrices: z.object({
    US: z.number().finite().positive().max(100000).nullable().optional(),
    CA: z.number().finite().positive().max(100000).nullable().optional(),
    UK: z.number().finite().positive().max(100000).nullable().optional(),
    AZ: z.number().finite().positive().max(100000).nullable().optional()
  }).optional(),
  availabilityByCountry: z.object({
    US: z.boolean().optional(), CA: z.boolean().optional(), UK: z.boolean().optional(), AZ: z.boolean().optional()
  }).optional(),
  description: z.string().trim().max(10000).optional(),
  variantCombinations: z.array(z.object({
    color: z.string().trim().min(1).max(60).nullable(),
    size: z.string().trim().min(1).max(60).nullable(),
    price: z.number().finite().positive().max(100000)
  })).max(100).optional(),

  images: z.array(
    z.string().trim().url().max(1000)
  ).max(8).optional(),

  video: z.string().trim().url().max(1000).nullable().optional(),

  stock: z.number().int().min(0).max(100000).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  gtin: z.string().trim().refine(isValidGtin, 'Enter a valid GTIN with a correct check digit.').nullable().optional(),
  mpn: z.string().trim().max(100).nullable().optional(),
  identifierExists: z.boolean().optional()
});
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const parsed = adminProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product details.' });
  if (parsed.data.oldPrice != null && parsed.data.oldPrice <= parsed.data.price) return res.status(400).json({ error: 'Compare-at price must be higher than the current price.' });
  if (parsed.data.saleEndsAt && parsed.data.oldPrice == null) return res.status(400).json({ error: 'A sale end time requires a compare-at price.' });
  if (parsed.data.availabilityByCountry?.AZ === true && !(Number(parsed.data.countryPrices?.AZ) > 0)) {
    return res.status(400).json({ error: 'Enter the final all-in Azerbaijan price in AZN before enabling this product for Azerbaijan.' });
  }
  const variantError = validateVariantCombinations(parsed.data.variantCombinations || []);
  if (variantError) return res.status(400).json({ error: variantError });
  const product = {
    id: Math.max(0, ...db.data.products.map(p => p.id || 0)) + 1,
    title: parsed.data.title,
    price: Number(Number(parsed.data.price).toFixed(2)),
    oldPrice: parsed.data.oldPrice ?? null,
    saleEndsAt: parsed.data.saleEndsAt ?? null,
    countryPrices: { US: Number(parsed.data.price), CA: null, UK: null, AZ: null, ...(parsed.data.countryPrices || {}) },
    availabilityByCountry: { US: true, CA: true, UK: true, AZ: false, ...(parsed.data.availabilityByCountry || {}) },
    description: parsed.data.description ?? '',
    variantCombinations: parsed.data.variantCombinations || [],
    images: parsed.data.images || [],
video: parsed.data.video || null,
    stock: parsed.data.stock ?? 0,
    category: parsed.data.category || 'General',
    brand: parsed.data.brand || null,
    gtin: parsed.data.gtin || null,
    mpn: parsed.data.mpn || null,
    identifierExists: parsed.data.identifierExists === false ? false : null,
    createdAt: new Date().toISOString(),
    rating: 5,
    reviews: 0,
    badge: 'New'
};
  db.data.products.push(product);
  await db.write();
  res.status(201).json({ product });
});
app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const parsed = adminProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product details.' });
  const product = db.data.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  const nextPrice = parsed.data.price !== undefined ? parsed.data.price : Number(product.price);
  const nextOldPrice = parsed.data.oldPrice !== undefined ? parsed.data.oldPrice : (product.oldPrice ?? null);
  const nextSaleEndsAt = parsed.data.saleEndsAt !== undefined ? parsed.data.saleEndsAt : (product.saleEndsAt ?? null);
  if (nextOldPrice != null && nextOldPrice <= nextPrice) return res.status(400).json({ error: 'Compare-at price must be higher than the current price.' });
  if (nextSaleEndsAt && nextOldPrice == null) return res.status(400).json({ error: 'A sale end time requires a compare-at price.' });
  const nextAzAvailable = parsed.data.availabilityByCountry?.AZ ?? product.availabilityByCountry?.AZ ?? false;
  const hasAzPriceUpdate = parsed.data.countryPrices && Object.prototype.hasOwnProperty.call(parsed.data.countryPrices, 'AZ');
  const nextAzPrice = hasAzPriceUpdate ? parsed.data.countryPrices.AZ : product.countryPrices?.AZ;
  if (nextAzAvailable && !(Number(nextAzPrice) > 0)) {
    return res.status(400).json({ error: 'Enter the final all-in Azerbaijan price in AZN before enabling this product for Azerbaijan.' });
  }
  const variantError = validateVariantCombinations(parsed.data.variantCombinations || product.variantCombinations || []);
  if (variantError) return res.status(400).json({ error: variantError });
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) product[key] = value;
  }
  if (parsed.data.countryPrices !== undefined) product.countryPrices = { ...(product.countryPrices || {}), ...parsed.data.countryPrices };
  if (parsed.data.availabilityByCountry !== undefined) {
    product.availabilityByCountry = { US: true, CA: true, UK: true, AZ: false, ...(product.availabilityByCountry || {}), ...parsed.data.availabilityByCountry };
  }
  if (parsed.data.price !== undefined) product.price = Number(Number(parsed.data.price).toFixed(2));
  await db.write();
  res.json({ product });
});
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const before = db.data.products.length;
  db.data.products = db.data.products.filter(p => String(p.id) !== String(req.params.id));
  if (db.data.products.length === before) return res.status(404).json({ error: 'Product not found.' });
  await db.write();
  res.json({ ok: true });
});

app.use((req, res, next) => { if (req.method !== 'GET' || req.path.startsWith('/api/')) return next(); res.sendFile(path.join(__dirname, 'public', 'index.html')); });

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});


async function processCartRecoveryQueue() {
  if (!CART_RECOVERY_ENABLED) return;
  const now = Date.now();
  const due = (db.data.cartRecoveries || []).filter(record => record.status === 'pending'
    && now - Date.parse(record.createdAt) >= 2 * 60 * 60 * 1000
    && (!record.lastAttemptAt || now - Date.parse(record.lastAttemptAt) >= 6 * 60 * 60 * 1000)).slice(0, 10);
  for (const record of due) {
    const paidSince = db.data.orders.some(order => {
      const paidAt = Date.parse(order.paymentUpdatedAt || order.createdAt || '');
      return String(order.email || '').toLowerCase() === record.email
        && order.paymentStatus === 'Paid' && Number.isFinite(paidAt) && paidAt >= Date.parse(record.createdAt);
    });
    if (paidSince) { record.status = 'recovered'; await db.write(); continue; }
    const token = randomBytes(24).toString('hex');
    record.unsubscribeTokenHash = createHash('sha256').update(token).digest('hex');
    record.lastAttemptAt = new Date().toISOString();
    record.attempts = (Number(record.attempts) || 0) + 1;
    await db.write();
    const rows = (record.items || []).map(item => `<li style="margin:0 0 10px"><a href="${escapeXml(item.url)}">${escapeXml(item.title)}</a> × ${Number(item.qty) || 1}</li>`).join('');
    const unsubscribeUrl = `${PUBLIC_SITE_URL}/api/cart-recovery/unsubscribe/${token}`;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL, to: [record.email], subject: 'Your DreamGrind finds are still here',
          html: `<div style="font:15px/1.6 Arial,sans-serif;color:#18334b;max-width:560px;margin:auto"><h1 style="font-size:25px">Still thinking it over?</h1><p>The items you viewed at DreamGrind are still available to explore. Product availability and prices can change, so please check the store for the latest details.</p><ul>${rows}</ul><p><a href="${PUBLIC_SITE_URL}/" style="display:inline-block;padding:12px 18px;background:#087fc2;color:#fff;text-decoration:none;border-radius:8px">Return to DreamGrind</a></p><p style="font-size:12px;color:#6b7d8e">You received this reminder because you explicitly asked DreamGrind to email you about your unfinished checkout. <a href="${unsubscribeUrl}">Unsubscribe from these reminders</a>.</p></div>`
        })
      });
      if (response.ok) { record.status = 'sent'; record.sentAt = new Date().toISOString(); }
      else { const detail = await response.text().catch(() => ''); record.lastError = `Resend ${response.status}: ${detail.slice(0, 300)}`; console.error('CART RECOVERY EMAIL ERROR:', response.status, detail.slice(0, 300)); }
      await db.write();
    } catch (error) {
      record.lastError = String(error?.message || error).slice(0, 300);
      console.error('CART RECOVERY EMAIL ERROR:', error);
      await db.write();
    }
  }
}
if (CART_RECOVERY_ENABLED) {
  const cartRecoveryTimer = setInterval(() => { processCartRecoveryQueue().catch(error => console.error('CART RECOVERY WORKER ERROR:', error)); }, 15 * 60 * 1000);
  cartRecoveryTimer.unref?.();
  processCartRecoveryQueue().catch(error => console.error('CART RECOVERY WORKER ERROR:', error));
}

async function processExpiredCheckoutOrders() {
  const now = Date.now();
  const graceMs = 5 * 60 * 1000;
  let changed = false;

  for (const order of (db.data.orders || [])) {
    if (!order || order.paymentStatus !== 'Pending' || order.status !== 'Awaiting payment') continue;
    if (order.shippingQuoteRequired === true || order.shippingQuoteConfirmedAt == null && order.country === 'Azerbaijan' && !db.data.checkoutTokens?.[order.id]) continue;

    const checkout = db.data.checkoutTokens?.[order.id];
    const tracking = db.data.orderTrackingTokens?.[order.id];
    const storedExpiry = Number(checkout?.expiresAt || tracking?.expiresAt || (Date.parse(order.checkoutExpiresAt || '') || 0));
    if (!storedExpiry || now < storedExpiry + graceMs) continue;

    // Never cancel an order that has any positive or already confirmed payment evidence.
    if (order.paymentStatus === 'Paid' || order.paymentStatus === 'Refunded' || order.paymentTransaction || Number(order.paymentAmount) > 0) continue;

    restoreGrindPointsRedemption(order);
    order.status = 'Cancelled';
    order.cancelledAt = new Date(now).toISOString();
    order.cancellationReason = 'Checkout session expired before payment confirmation.';
    if (db.data.checkoutTokens) delete db.data.checkoutTokens[order.id];
    changed = true;
  }

  if (changed) await db.write();
  return changed;
}

const expiredCheckoutTimer = setInterval(() => {
  processExpiredCheckoutOrders().catch(error => console.error('EXPIRED CHECKOUT CLEANUP ERROR:', error));
}, 15 * 60 * 1000);
expiredCheckoutTimer.unref?.();
processExpiredCheckoutOrders().catch(error => console.error('EXPIRED CHECKOUT CLEANUP ERROR:', error));

app.listen(PORT, () => console.log(`DreamGrind running at http://localhost:${PORT}`));
