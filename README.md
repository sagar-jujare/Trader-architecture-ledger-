# TradeLedger — Phase 4 white UI / multi-user capital journal

Next.js 15, Prisma 6, Neon PostgreSQL, invite-only user registration, Cashfree hosted link + manual bank transfer payments, admin approval, white trader UI, per-user Excel-style capital journal.

## Setup
1. Node.js 20+, `npm install`.
2. Copy `.env.example` to `.env`; enter `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct), admin email/password, and payment information.
3. `npx prisma validate && npx prisma generate`
4. `npx prisma migrate dev --name phase4` (for existing databases, this creates a migration without resetting data).
5. `npm run db:seed` (creates the initial admin if not present).
6. `npm run dev`; sign in at `/login`, admin dashboard `/admin`.

## Access flow
Admin enters trader **name, email, phone**, generates a 48-hour one-use invitation link, sends it privately. Trader chooses a password at `/invite/[token]`, pays by Cashfree hosted link / bank transfer, submits reference, and admin manually approves. Only approved, active subscriptions can access `/ledger`, `/journal`, `/calendar`, `/mistakes`, `/reports`.

## Ledger design
- `LedgerSettings` is unique by `userId` and contains starting capital, number of trading days (1–1000), target %, max daily loss %, risk % and start date.
- `LedgerDay` has a unique `(userId, dayNumber)` constraint. Only the authenticated user can upsert their own days. No cross-user reads.
- Daily net P&L = gross profit - gross loss - charges.
- Closing balance = opening balance + net P&L + deposits - withdrawals.
- Daily return = net P&L / opening balance; benchmarks compound using target percentage.
- The spreadsheet-like UI is scrollable, with 17 columns and editable entry forms. It does not yet support drag-and-drop column rearrangement, custom formulas, CSV/XLSX export, or full trade-to-ledger reconciliation.

## Important
The app has not been tested against your live Neon project or Cashfree account. Manual payment references must be independently verified; a submitted reference is not proof of payment. Use a separate Neon branch for migration testing and back up production data before deploying. Rate limits, email delivery, invitation resend, audit UI and production monitoring should be added before accepting customers.


## Phase 5 Admin improvements

- `/admin`: white/lime-inspired professional overview, payment review, searchable/filterable paginated customer directory, and invite form with name/email/phone.
- `/admin/users/[id]`: customer details, onboarding status, trade and ledger counts, payment history, invitation status, editable subscription plan/expiry/status, suspend and revoke controls.
- Server actions enforce admin authorization and write audit logs for subscription edits.
- **Existing Neon database:** read `DATABASE_RECOVERY.md` before running any migration. Never reset an existing database with users/payments.
