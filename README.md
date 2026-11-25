# DreamGrind v5

Full-stack local starter for DreamGrind.

## Start

1. Install Node.js LTS.
2. Copy `.env.example` to `.env`.
3. Set `JWT_SECRET` to a random value with at least 32 characters.
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your own admin credentials.
5. Install packages:

```powershell
npm.cmd install
```

6. Start:

```powershell
npm.cmd start
```

7. Open:

`http://localhost:3000`

Admin panel:

`http://localhost:3000/admin.html`


## Azerbaijan standard checkout

- Azerbaijan uses the normal on-site checkout and the existing Epoint payment flow. The payment provider integration is unchanged; new orders receive a secure checkout token and are redirected to Epoint.
- A product is available in Azerbaijan only when `availabilityByCountry.AZ` is enabled and an explicit positive `countryPrices.AZ` value is saved. The AZN amount must be the confirmed final selling price for that offer.
- In Admin → Products, enter the all-in Azerbaijan price in AZN, then tick “Available in Azerbaijan”. Cover product cost, sourcing/service fees, delivery, applicable customs/taxes confirmed for the exact product and route, payment fees and DreamGrind's margin. The server and storefront do not auto-convert USD catalogue prices into AZN for Azerbaijan.
- The shipping line at checkout is included in the displayed product price; the backend records shipping as 0 so it is not charged twice. The product's AZN price is the amount submitted to Epoint.
- Existing older Azerbaijan orders still marked “Awaiting shipping quote” retain the legacy Admin payment-link action. New Azerbaijan orders go through normal Epoint checkout.
- Do not advertise DDP or customs/tax inclusion unless the selected supplier or logistics provider has confirmed those terms in writing for that exact offer.
- Epoint continues to settle payments in AZN. USD, CAD and GBP remain display currencies for the other markets.

## Admin features

- Admin login using the server-side admin credentials.
- Dashboard metrics.
- Order list with status and tracking-number updates.
- Product create/edit/delete.
- Customer list.
- Customer messages, including guest messages with a name and email.
- Newsletter subscriber list with CSV export.


## Production launch checklist (Render + Epoint)

Before accepting live orders, verify the following in the Render service:

- `DATABASE_URL` points to the production PostgreSQL database. Do not replace or reset the existing database when deploying an update.
- `JWT_SECRET` is a random value with at least 32 characters.
- `NODE_ENV=production` is set so session cookies use the Secure attribute over HTTPS.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set to private credentials. Do not use the example values.
- `EPOINT_PUBLIC_KEY` and `EPOINT_PRIVATE_KEY` are set as Render environment variables. Never place the private key in frontend files or share it in screenshots.
- `PAYMENT_BASE_URL` is the exact HTTPS storefront URL, with no trailing slash.
- `AZERBAIJAN_CHECKOUT_ENABLED=true` to accept normal Azerbaijan checkout. Set it to `false` only if the market must be paused temporarily.

In the Epoint merchant settings, verify the registered URLs:

- Website: `https://your-store-domain/`
- Success URL: `https://your-store-domain/`
- Error URL: `https://your-store-domain/`
- Result URL: `https://your-store-domain/api/payment/callback`

The result URL is essential: Epoint's server-to-server callback is the source of truth for whether an order is paid. The storefront now checks the order's server-side payment status before clearing the cart or displaying a confirmed-payment message.

## Operational notes before launch

- Current shipping is configured as free for the US, Canada and UK. Keep this only if the supplier's final landed shipping cost is included in the product prices or otherwise covered by the margin.
- The customer-facing order page shows the order status and any tracking number entered in the admin panel. It does not yet fetch live carrier scans from a carrier API.
- Guest visitors can contact the store without registering. Guest messages are protected by a rate limit and appear in the admin Messages tab.
- Mark an order as `Refunded` in the admin panel only after the refund has actually been processed; this also removes it from paid revenue totals.
- Test with a low-value payment or an Epoint-approved test setup before opening paid advertising.

## Security notes

- Passwords are bcrypt-hashed.
- Session token is in an HttpOnly cookie.
- `.env` is ignored by git.
- Never put card numbers or payment secrets in frontend JavaScript.
- Epoint payment requests and callbacks are implemented in the server; production credentials must be stored as Render environment variables.


## Azerbaijan direct checkout + country phone prefix release (20261120-az-direct-checkout-phone-v3)

- Azerbaijan uses the existing on-site Epoint checkout: the server creates an order, returns a short-lived checkout token, and the storefront calls the existing `/api/payment/create` route.
- The Epoint request-signing function, payment request endpoint, callback signature/amount validation and paid-order status updates are preserved.
- Azerbaijan final selling prices must be entered explicitly in Admin in AZN. Set the product's AZ price to the final customer-facing amount for that offer, including supplier delivery and only those customs/import/handling costs DreamGrind has decided to cover. This is not a DDP promise. Products without a final AZN price are hidden/blocked for Azerbaijan rather than silently converted from USD.
- The separate shipping line is zero for new Azerbaijan checkout orders because delivery and covered charges are already part of the product's final AZN price; this avoids charging shipping twice.
- Existing manual shipping-quote orders remain supported through the legacy Admin payment-link route. They are not deleted or converted automatically.
- The phone field shows a fixed calling code: +994 for Azerbaijan, +1 for the USA and Canada, and +44 for the UK. The customer enters only the national digits. The country prefix changes with the checkout country; changing the country clears the old national number.
- Browser and server both normalize/validate phone numbers and save them in E.164 form.


## DreamGrind Growth 2.0

This release adds customer-experience, measurement, trust and product-discovery features on top of the existing storefront. It does not replace the Epoint checkout or reset the PostgreSQL database.

### Storefront improvements

- DreamGrind Discovery ranks currently available products using completed paid-order quantities and product creation recency. It does not fabricate popularity counts.
- DreamGrind Finder filters the real catalogue by category, market availability, keyword and local-currency budget.
- Recently viewed products are stored in the visitor's browser only.
- Related-product suggestions and an optional “Add both” action are available on product pages. Prices remain separate and no automatic bundle discount is applied.
- The existing wishlist and cart remain in place.
- Product pages now show a verified-review area. A review is accepted only when the order number and checkout email match a paid order containing that product. One review per product per order is allowed.
- Grind Points are an earn-only balance: signed-in customers receive one point per whole USD-equivalent paid, after Epoint confirms payment. Guest orders do not earn points. Refunded orders have their points reversed. Points cannot yet be redeemed for discounts or cash.
- A bilingual FAQ explains delivery, customs, payment, tracking and verified reviews. It is a fixed information helper, not an AI chatbot.

### Analytics and privacy

- The included GA4 integration loads only after the visitor explicitly allows optional analytics. Rejecting analytics keeps the store's essential cart/account functions available and prevents GA4 events from being sent.
- Advertising storage and ad personalization remain denied. No ad pixels or remarketing tags are added by this release.
- Ecommerce events include product-list views, product views, add-to-cart, wishlist, cart views, checkout start, payment information, search, review submission and purchase.
- Purchase is recorded only after the storefront re-checks the order and sees `paymentStatus: Paid` from the server. The Epoint callback remains the payment source of truth.
- Search analytics omits email-like queries and long digit sequences to reduce the chance of sending personal information to GA4.
- Page attribution retains only allow-listed `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` parameters after basic email/long-number filtering. Other URL query parameters are not sent in page-view locations. Add UTMs to Meta/Instagram ad URLs to compare campaign traffic in GA4.

### Optional abandoned-checkout reminders

This feature is disabled until both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured. The sender domain must be verified in Resend. When enabled, the checkout form offers a separate, unchecked opt-in. Only a customer who checks that box may receive one reminder, no sooner than two hours after the saved preference. The email includes an unsubscribe link. This is not a newsletter or marketing subscription. Unchecking the box cancels the pending reminder. If you do not configure Resend, no reminder checkbox appears and no email is sent.

### Reviews and loyalty data

The new `reviews` and `cartRecoveries` collections are added to the existing JSON state object. In Render/PostgreSQL, these are ordinary fields inside the existing `dreamgrind_state.value` JSON document. The deployment does not drop or recreate the table. Keep the existing `DATABASE_URL` unchanged.

### Google Merchant Center and SEO

- Dynamic `robots.txt` and `sitemap.xml` endpoints are generated from the configured public site URL.
- Product pages receive Product JSON-LD with current market price, and genuine brand/GTIN/MPN and verified-review data when available.
- Country-specific product feeds are available at `/feed/google.xml?country=US`, `CA`, `UK` or `AZ`.
- A product is intentionally omitted from the Merchant Center feed until it has an image, positive price, positive Admin stock, real manufacturer brand, and a valid GTIN or MPN. A supplied GTIN is checked for both supported length and check digit. Inventory is marked `in_stock` only when Admin stock is greater than zero. Do not invent brand names, barcodes, part numbers or stock levels to force products into the feed.
- The feed's zero shipping price reflects the storefront's current free-shipping checkout configuration for these destinations. Customs, duties or taxes are not represented as included unless the exact product offer confirms that they are covered.

### New Render environment variables

Add these as separate environment variables in Render. Do not delete, rotate or overwrite your existing Epoint keys, `DATABASE_URL`, `JWT_SECRET`, admin credentials or payment URL settings.

- `GA_MEASUREMENT_ID`: your GA4 Web data stream ID, such as `G-XXXXXXXXXX`. Leave blank to keep GA4 disabled and hide the consent prompt.
- `PUBLIC_SITE_URL`: the canonical public domain, normally `https://dreamgrind.store`.
- `RESEND_API_KEY`: optional Resend API key. Leave blank to keep abandoned-checkout reminders disabled.
- `RESEND_FROM_EMAIL`: optional sender in the format `DreamGrind <orders@your-verified-domain>`. It must be an address on a domain verified in Resend.

After updating these variables, trigger one Render deploy. Verify `/api/health`, `/api/store-config`, `/robots.txt`, `/sitemap.xml` and the relevant country feed. The public config endpoint returns only the GA measurement ID and feature flags; it never returns the Resend key or Epoint secrets.

### Safe deployment sequence

1. Keep the current Render PostgreSQL database and all existing environment values.
2. Upload/commit this full source package to the same GitHub repository and branch. Include the updated files under `public/` and the root `server.js`/`database.js` files.
3. Let Render deploy the commit. Confirm the deploy logs show the server starting normally.
4. Test browsing, country switching, variants, cart, guest checkout, Epoint redirect and a low-value payment or approved test transaction.
5. Only after the normal store and payment checks pass, add the GA4 and optional Resend variables.
6. In Admin, add real manufacturer identifiers and an accurate positive stock quantity before expecting a product to appear as available in the Merchant Center feed.

The release was checked with JavaScript syntax validation and seven automated static integrity tests (`npm test`). A live Epoint transaction, Resend email delivery, GA4 reporting and Merchant Center account approval cannot be certified from a local source archive; verify those in their respective services before relying on them.
