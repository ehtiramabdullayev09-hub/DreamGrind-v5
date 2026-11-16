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


## Azerbaijan market is enabled

- Azerbaijan is available as a storefront destination and all existing catalogue products are enabled there unless manually disabled in Admin.
- Product AZN prices use the configured product-specific AZN price when present; otherwise they are calculated from the USD catalogue price using the current storefront conversion rate of 1 USD = 1.70 AZN. Review this rate and product margins before advertising.
- Azerbaijan checkout creates an order request first. The customer sees the product subtotal in AZN; no payment is taken until the delivery fee is confirmed.
- In Admin → Orders, enter the confirmed Azerbaijan delivery fee in AZN and choose “Create Epoint link”. Copy the generated secure payment link and send it to the customer by WhatsApp or email. The final order total is product subtotal plus the confirmed delivery fee.
- Do not advertise a fixed delivery fee, guaranteed DDP, or customs/tax inclusion for Azerbaijan until the selected supplier or logistics provider has confirmed those terms in writing.
- Epoint continues to settle payments in AZN. USD, CAD and GBP are display currencies; the backend stores payment totals in AZN.

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
- `AZERBAIJAN_CHECKOUT_ENABLED=true` to accept Azerbaijan order requests. Set it to `false` only if the market must be paused temporarily.

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
