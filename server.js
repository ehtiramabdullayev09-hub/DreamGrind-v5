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
import { JSONFilePreset } from 'lowdb/node';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
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
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and at least 32 characters long.');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before starting.');
  process.exit(1);
}
await mkdir(path.join(__dirname, 'data'), { recursive: true });
const db = await JSONFilePreset(path.join(__dirname, 'data', 'db.json'), {
  users: [],
  products: [],
  orders: [],
  messages: [],
  newsletter: []
});

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(express.static(path.join(__dirname, 'public')));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
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
  country: z.enum(['United States', 'Canada', 'United Kingdom']),
  items: z.array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(20), variant: z.string().max(80).nullable().optional() })).min(1).max(50)
});
const messageSchema = z.object({ text: z.string().trim().min(1).max(2000) });
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
    language: 'az',
    order_id: String(orderId),
    description: description || `DreamGrind order ${orderId}`,
    success_redirect_url: `${PAYMENT_BASE_URL}/?payment=success&order_id=${encodeURIComponent(orderId)}`,
    error_redirect_url: `${PAYMENT_BASE_URL}/?payment=error&order_id=${encodeURIComponent(orderId)}`,
  result_url: `${PAYMENT_BASE_URL}/api/payment/callback`};

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
function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
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
  if (db.data.products.length) return;
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
await ensureAdmin();

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dreamgrind-api' }));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check your name, email and password.' });
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  if (db.data.users.some(u => u.email === normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = { id: nextId('USR', db.data.users), name, email: normalizedEmail, passwordHash, role: 'customer', createdAt: new Date().toISOString() };
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

app.get('/api/products', (_req, res) => res.json({ products: db.data.products }));

app.post('/api/newsletter', async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email.' });
  const email = parsed.data.email.toLowerCase();
  if (!db.data.newsletter.some(x => x.email === email)) db.data.newsletter.push({ email, createdAt: new Date().toISOString() });
  await db.write();
  res.status(201).json({ ok: true });
});

app.post('/api/orders', requireAuth, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order details.' });
  const { name, email, phone, address, city, country, items } = parsed.data;
  const productMap = new Map(db.data.products.map(p => [p.id, p]));
  const normalizedItems = items.map(item => {
    const p = productMap.get(item.id);
    if (!p) throw new Error(`Unknown product: ${item.id}`);
    return { id: p.id, title: p.title, unitPrice: p.price, qty: item.qty, variant: item.variant ?? null };
  });
  const subtotal = normalizedItems.reduce((s, x) => s + x.unitPrice * x.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const order = {
    id: nextId('DG', db.data.orders),
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    status: 'Processing',
    trackingNumber: null,
    name, email: email.toLowerCase(), phone, address, city, country,
    items: normalizedItems,
    subtotal, shipping, total: subtotal + shipping
  };
  db.data.orders.unshift(order);
  await db.write();
  res.status(201).json({ order: { id: order.id, status: order.status, createdAt: order.createdAt, total: order.total } });
});
app.post('/api/payment/create', requireAuth, async (req, res) => {
  const parsed = z.object({
    orderId: z.string().trim().min(3)
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const order = db.data.orders.find(
    o => o.id === parsed.data.orderId && o.userId === req.user.id
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (!EPOINT_PUBLIC_KEY || !EPOINT_PRIVATE_KEY) {
    return res.status(503).json({
      error: 'Epoint payment is not configured yet.'
    });
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
    res.status(502).json({
      error: 'Unable to create payment.'
    });
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

    if (signature !== expectedSignature) {
      console.error('EPOINT CALLBACK: invalid signature');
      return res.status(400).json({
        error: 'Invalid signature.'
      });
    }

    const decoded = JSON.parse(
      Buffer.from(data, 'base64').toString('utf8')
    );

    const order = db.data.orders.find(
      o => o.id === decoded.order_id
    );

    if (!order) {
      console.error('EPOINT CALLBACK: order not found:', decoded.order_id);
      return res.status(404).json({
        error: 'Order not found.'
      });
    }

    if (decoded.status === 'success') {
      order.status = 'Paid';
      order.paymentStatus = 'Paid';
      order.paymentTransaction = decoded.transaction || null;
      order.paymentAmount = decoded.amount || null;
      order.paymentUpdatedAt = new Date().toISOString();
    } else {
      order.status = 'Payment failed';
      order.paymentStatus = decoded.status || 'failed';
      order.paymentTransaction = decoded.transaction || null;
      order.paymentUpdatedAt = new Date().toISOString();
    }

    await db.write();

    console.log(
      'EPOINT CALLBACK:',
      order.id,
      decoded.status,
      decoded.transaction || ''
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error('EPOINT CALLBACK ERROR:', error);
    return res.status(400).json({
      error: 'Invalid payment callback.'
    });
  }
});
app.get('/api/orders/me', requireAuth, (req, res) => {
    console.log('CURRENT USER ID:', req.user.id);

    console.log(
        'ORDERS:',
        db.data.orders.map(o => ({
            id: o.id,
            userId: o.userId
        }))
    );

    const orders = db.data.orders.filter(
        o => o.userId === req.user.id
    );

    res.json({ orders });
});

app.get('/api/orders/track/:code', (req, res) => {
  const order = db.data.orders.find(o => o.id === req.params.code.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order: { id: order.id, status: order.status, createdAt: order.createdAt, trackingNumber: order.trackingNumber } });
});

app.post('/api/messages', requireAuth, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Message is empty or too long.' });
  const message = { id: nextId('MSG', db.data.messages), userId: req.user?.id ?? null, text: parsed.data.text, from: 'customer', createdAt: new Date().toISOString() };
  db.data.messages.push(message);
  await db.write();
  res.status(201).json({ message: { id: message.id, text: message.text, createdAt: message.createdAt } });
});

app.get('/api/messages/me', requireAuth, (req, res) => {
  res.json({ messages: db.data.messages.filter(m => m.userId === req.user.id).map(m => ({ id: m.id, text: m.text, from: m.from, createdAt: m.createdAt })) });
});

app.get('/api/admin/summary', requireAdmin, (_req, res) => {
  const orders = db.data.orders;
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  res.json({ users: db.data.users.length, orders: orders.length, revenue, messages: db.data.messages.length, newsletter: db.data.newsletter.length });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => res.json({ orders: db.data.orders }));
app.get('/api/admin/messages', requireAdmin, (_req, res) => res.json({ messages: db.data.messages }));
app.get('/api/admin/users', requireAdmin, (_req, res) => res.json({ users: db.data.users.map(sanitizeUser) }));

const adminOrderUpdateSchema = z.object({
  status: z.enum(['Processing', 'Shipped', 'In transit', 'Delivered', 'Cancelled', 'Refunded']),
  trackingNumber: z.string().trim().max(120).nullable().optional()
});
app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const parsed = adminOrderUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order update.' });
  const order = db.data.orders.find(o => o.id === req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.status = parsed.data.status;
  if (parsed.data.trackingNumber !== undefined) order.trackingNumber = parsed.data.trackingNumber || null;
  await db.write();
  res.json({ order });
});

const adminProductSchema = z.object({
  title: z.string().trim().min(2).max(160),
  price: z.number().finite().positive().max(100000),

  images: z.array(
    z.string().trim().url().max(1000)
  ).max(8).optional(),

  video: z.string().trim().url().max(1000).nullable().optional(),

  stock: z.number().int().min(0).max(100000).optional(),
  category: z.string().trim().min(2).max(80).optional()
});
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const parsed = adminProductSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product details.' });
  const product = {
    id: Math.max(0, ...db.data.products.map(p => p.id || 0)) + 1,
    title: parsed.data.title,
    price: Number(Number(parsed.data.price).toFixed(2)),
    images: parsed.data.images || [],
video: parsed.data.video || null,
    stock: parsed.data.stock ?? 0,
    category: parsed.data.category || 'General',
    rating: 5,
    reviews: 0,
    badge: 'New'
};
  db.data.products.push(product);
  await db.write();
  res.status(201).json({ product });
});
app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
  
  if (!parsed.success) return res.status(400).json({ error: 'Invalid product details.' });
  const product = db.data.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  Object.assign(product, parsed.data);
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

app.listen(PORT, () => console.log(`DreamGrind running at http://localhost:${PORT}`));
