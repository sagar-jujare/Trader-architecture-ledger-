# Landing page update

This release extends the existing Phase 8 project with a long-form white landing page. The four user-provided screenshots are copied to `public/analysis-proof/`. They are displayed as analysis examples only, not proof of executed trades or verified profit. The testimonials are explicitly marked fictional layout samples and MUST be replaced with consented authentic reviews before presenting them as customer feedback.

All other routes and Prisma models are unchanged. No new migration is needed.

Run `npm install`, `npx prisma generate`, `npm run build` and `npm run dev`. Keep your existing `.env` file and do not reset the Neon database.
