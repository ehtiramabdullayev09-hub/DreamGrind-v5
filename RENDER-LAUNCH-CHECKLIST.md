# DreamGrind — Render launch checklist

This package contains the updated application source. It does not contain production database data or private payment credentials.

## 1. Deploy the source without replacing the database

- Upload/commit the contents of this project to the same GitHub repository connected to the existing Render web service, or deploy it using the same method used for the current version.
- Keep the existing Render PostgreSQL database and its `DATABASE_URL`. Do not create an empty replacement database and do not clear the existing `dreamgrind_state` record.
- Build command: `npm ci`
- Start command: `npm start`
- Runtime: Node.js 20 LTS or newer supported Node.js LTS.

## 2. Render environment variables

Set/verify these in the existing Render service:

- `NODE_ENV=production`
- `DATABASE_URL` = the existing production PostgreSQL connection string
- `JWT_SECRET` = a unique random secret, at least 32 characters
- `ADMIN_EMAIL` = the store's private admin email
- `ADMIN_PASSWORD` = a strong, private admin password
- `EPOINT_PUBLIC_KEY` = the merchant public key
- `EPOINT_PRIVATE_KEY` = the merchant private key
- `PAYMENT_BASE_URL=https://dreamgrind-v5.onrender.com`
- `AZERBAIJAN_CHECKOUT_ENABLED=true` (or remove the variable; the app enables normal Azerbaijan checkout by default)

Do not put the Epoint private key in frontend code, the repository, screenshots or customer messages.

## 3. Epoint merchant URLs

In the Epoint merchant settings, verify the values registered with Epoint:

- Website URL: `https://dreamgrind-v5.onrender.com/`
- Success URL: `https://dreamgrind-v5.onrender.com/`
- Error URL: `https://dreamgrind-v5.onrender.com/`
- Result URL: `https://dreamgrind-v5.onrender.com/api/payment/callback`

The Result URL is essential. The backend confirms payment only from the verified server-to-server callback and checks that its amount matches the stored order total.

## 4. Azerbaijan standard checkout

- Set each product's confirmed final AZN price in Admin → Products and enable Azerbaijan only after that price is saved.
- The AZN selling amount must cover product cost, sourcing/service costs, delivery and applicable customs/taxes confirmed for that exact offer, Epoint/payment fees and DreamGrind's margin. The website does not auto-convert a USD price for Azerbaijan.
- For products with variants, the site scales variant prices proportionally from the base AZN price using the variant USD-price ratio. Use separate listings if variants have materially different all-in delivery or tax costs.
- Customers enter their name, email, +994 mobile number and full Azerbaijan delivery address, including rayon and postal code.
- The customer pays the displayed total through the same on-site Epoint checkout used by the other markets. The backend records the order as Awaiting payment until Epoint's verified callback confirms the payment.
- Existing legacy orders with status “Awaiting shipping quote” can still be completed from Admin using the older payment-link action.
- Do not claim DDP or prepaid customs/VAT unless the selected supplier or freight provider has confirmed this for the exact product and route.

## 5. Before advertising / taking live orders

- Open the storefront on a phone and a desktop browser.
- Select United States, Canada, United Kingdom and Azerbaijan one by one; check currency, product availability, cart and checkout address fields.
- Confirm each product's selling price covers supplier purchase cost, sourcing/service fees, inspection/packing, delivery and applicable charges confirmed for the selected route.
- US/CA/UK checkout shipping offers must match the supplier quote and product margin. For Azerbaijan, use only products with a confirmed all-in AZN price; there is no separate shipping amount at checkout.
- Before listing an item for Azerbaijan, enter and verify its final all-in AZN price in Admin → Products. Confirm the supplier's delivery and any applicable customs/tax terms for the exact product and route.
- Submit one low-value test payment (or use an Epoint-approved test method). Verify the order changes to Paid only after the callback, that the cart clears only after confirmation, and that the order appears in Admin.
- Add a tracking number in Admin and check that it appears on the public order-tracking page.
- Send one guest contact message and check that it appears in Admin > Messages.
- Subscribe with a test email and check Admin > Newsletter; remove the test email if it should not remain.
- Confirm the customer-facing shipping, returns, privacy and terms text matches the actual fulfilment and refund arrangements.

## 6. Current functional boundaries

- Azerbaijan standard checkout is enabled; only products with a confirmed all-in AZN price are available to customers.
- The public tracking page shows the latest store-maintained order status and any tracking number entered in Admin. It does not yet display live scans from carrier APIs.
- Lost/damaged parcel replacements depend on the supplier's written terms and actual cooperation; the website does not automatically enforce supplier compensation promises.
- Newsletter emails are collected and can be exported from Admin as CSV. An email marketing provider is not integrated.

## Customer contact channels

- WhatsApp display number: `+994 99 899 80 97`
- WhatsApp click-to-chat: `https://wa.me/994998998097` (the trunk `0` after country code `+994` is omitted in the international WhatsApp link)
- Customer support email: `dreamgrindstore@gmail.com`
- Confirm both links from a mobile device before launch.
