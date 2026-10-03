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
- The included checkout is still a development/demo checkout; real payment integration is a later step.
