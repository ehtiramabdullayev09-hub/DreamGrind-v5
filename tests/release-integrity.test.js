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
  for (const file of ['server.js', 'database.js', 'lib/gtin.js', 'public/script.js', 'public/analytics.js', 'public/growth.js']) {
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
