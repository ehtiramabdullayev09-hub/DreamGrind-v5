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


## Azerbaijan market preparation

- The storefront includes Azerbaijan as a selectable destination and supports AZN product prices.
- Set `AZERBAIJAN_CHECKOUT_ENABLED=false` in Render while the DDP partner, customs process, delivery quotation and test shipment are still being verified. The server rejects Azerbaijan orders while this setting is false.
- In the admin product form, enter a separate Azerbaijan price in AZN and enable the Azerbaijan availability checkbox only for products you intend to offer there. Existing products default to unavailable in Azerbaijan.
- **Do not enable Azerbaijan checkout yet.** The current order calculation has no separate Azerbaijan shipping fee. Before opening the market, confirm the supplier's final DDP quote, configure delivery cost (either inside the final AZN product price or as a separate checkout fee), and make sure the cart, checkout and policies display the same arrangement.
- Epoint continues to settle all payments in AZN. The USD, CAD and GBP values are market display prices; stored order totals and admin revenue are in AZN.
- The customer privacy notice now explains that necessary order details may be shared with the overseas supplier and logistics partner for fulfilment, customs processing and delivery.

## Admin features

- Admin login using the server-side admin credentials.
- Dashboard metrics.
- Order list with status and tracking-number updates.
- Product create/edit/delete.
- Customer list.
- Customer messages.

## Security notes

- Passwords are bcrypt-hashed.
- Session token is in an HttpOnly cookie.
- `.env` is ignored by git.
- Never put card numbers or payment secrets in frontend JavaScript.
- Epoint payment requests and callbacks are implemented in the server; production credentials must be stored as Render environment variables.
