# GitHub update guide: 20261120-az-direct-checkout-phone-v3

1. Download and extract this ZIP on your computer.
2. In the existing `DreamGrind-v5` GitHub repository, replace the eight paths listed in `UPLOAD-INSTRUCTIONS-AZ-CHECKOUT.txt` with the matching files from this folder. Keep the `public/` folder structure exactly as shown.
3. Do not upload the ZIP itself. Do not delete other repository files.
4. Commit message: `Enable Azerbaijan direct checkout and country phone prefixes`.
5. Wait for Render's auto-deploy to finish.
6. Verify `/api/store-config` returns `azerbaijanCheckoutEnabled: true` and `azerbaijanShippingQuoteRequired: false`.
7. In Admin, set final AZN prices and enable availability only for products ready for Azerbaijan.
8. Test phone prefix changes for all four destinations and then test Epoint with a controlled low-value order after checking the amount.

Do not change Render secrets or the database. The existing Epoint payment signing and callback code is retained. Existing manual-quote orders remain in the database and remain eligible for the legacy Admin payment-link process.
