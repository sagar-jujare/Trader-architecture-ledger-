# Phase 8 — trading-day scheduling and invitation delivery

This full project includes Phase 7 invitation delivery (Resend email, Meta WhatsApp Cloud API or manual WhatsApp share), loading states and pending buttons, plus a Day 1 date picker and stock-market holiday exclusions.

## Trading calendar

In `/ledger` set **Choose date for Day 1**. The ledger assigns Day 1 to the first weekday on or after that date, then advances through weekdays only. Add exchange holidays in `YYYY-MM-DD` format, separated by commas, to exclude those dates as well. Market holidays differ by exchange and year, so the application deliberately does not invent a holiday list. Existing recorded journal days retain their saved dates; changing the schedule does not rewrite historical records.

## Database update — required

This release adds one nullable-safe column with a default to the existing `LedgerSettings` table. Back up/branch Neon first, then run in Neon SQL Editor:

```sql
ALTER TABLE "LedgerSettings" ADD COLUMN IF NOT EXISTS "holidayDates" TEXT NOT NULL DEFAULT '';
```

Run `npx prisma generate`, `npm run build` and `npm run dev` locally. Do not reset your database. The old missing migration history is a separate issue.

## Invitation delivery

See `README_PHASE7.md` for required Resend or WhatsApp Cloud API credentials. An invitation is saved without them but is **not automatically sent**. Manual WhatsApp opens a prefilled chat; the admin must press Send. Configure `APP_URL` to your public HTTPS domain.

## Build status

Archive integrity is verified; a full production build and live provider/database delivery have not been verified.
