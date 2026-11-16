# Updating the existing DreamGrind GitHub repository

This release enables Azerbaijan order requests and preserves the existing international storefront.

## Important: preserve the folder structure

Upload the extracted project contents to the ROOT of the existing `DreamGrind-v5` repository. Keep the `public` folder intact. In GitHub, the storefront files must remain inside `public/`:

- `public/index.html`
- `public/script.js`
- `public/style.css`
- `public/admin.html`
- `public/favicon.svg`
- `public/robots.txt`
- `public/sitemap.xml`

The server serves the `public/` directory. Do not move those files to the repository root. The root `index.html` is a duplicate project file; the live storefront is `public/index.html`.

Replace the existing project files with the matching files from this release; do not create duplicates with names such as `server (1).js` or `script (1).js`.

Do not upload `node_modules/`, `data/db.json`, `.env`, production credentials or private Epoint keys. Keep `.env.example` only as a reference.

## Deploy on the existing Render service

- Keep the same Render web service and its existing PostgreSQL database.
- Build command: `npm ci`
- Start command: `npm start`
- Ensure `AZERBAIJAN_CHECKOUT_ENABLED=true` in Render Environment (or remove this variable; the application enables Azerbaijan order requests by default). If it is explicitly `false`, Azerbaijan checkout is blocked.
- Keep all existing secrets and database connection variables in Render Environment. Do not replace the production database.

After GitHub receives the commit, confirm Render deploys the same latest commit from the `main` branch.

## Azerbaijan order process

Customers can now submit Azerbaijan orders in AZN. Since the exact delivery fee is not yet configured as a fixed checkout rate, the website first records the order request without taking payment. In Admin → Orders, enter the confirmed delivery fee in AZN and create the Epoint payment link. Send the link to the customer by WhatsApp or email. Do not claim DDP/customs-paid delivery unless the chosen carrier confirms it for that particular shipment.
