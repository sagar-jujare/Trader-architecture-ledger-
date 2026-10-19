# Phase 6 patch

- Fixed invalid JSX/TSX in `app/dashboard/page.tsx` (previous file caused `Expected comma, got }`).
- White landing page featuring trading and hypothetical compounding.
- Login modal for invalid credentials; WhatsApp help link +91 8088521053.
- Admin can issue 30-minute single-use password reset links from customer profile. Sessions are revoked; user chooses password.
- Existing invite acceptance now also supports password reset without changing an existing account's status.

## Start

`npm install && npx prisma generate && npm run dev`

No schema changes were introduced by this patch. Keep your existing `.env` and Neon database.

## Security notes

The admin reset URL contains a sensitive one-time token. Share privately, never post it in a public chat. For production, replace URL-in-query-string delivery with an email provider and use an isolated flash/session channel. Add login rate limiting and audit monitoring before public launch.
