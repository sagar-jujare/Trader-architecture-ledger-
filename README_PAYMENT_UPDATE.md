## Payment methods

Only Cashfree hosted payment links and manual bank transfer are offered to customers. The standalone UPI option has been removed from the payment UI and server-side submission validation. Existing historical UPI payment records are preserved in the database; the Prisma enum retains UPI for compatibility. No database migration is needed.

Cashfree payments still use the configured hosted payment link and require manual administrator verification in this version.
