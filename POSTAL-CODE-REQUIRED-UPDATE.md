# DreamGrind checkout update: postal code required

This update makes the postal/ZIP code mandatory for every supported destination (United States, Canada, United Kingdom and Azerbaijan).

Changes:
- Checkout postal-code field is required in the browser for all four countries.
- Azerbaijan now displays `Postal code *` / `Poçt indeksi *`, with `AZ1000` as an example.
- Server-side order validation rejects missing, whitespace-only or one-character postal codes, even if a request bypasses browser validation.
- Existing field aliases (`zip`, `zipCode`, `postalCode`, `postal_code`) remain accepted for compatibility.

Deploy the updated project files while preserving the existing Render environment variables and PostgreSQL database. Do not upload `.env` or secrets to GitHub.
