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
