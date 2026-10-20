# Request Access Form

The landing page's Request Access buttons open a visitor form collecting name, phone, email and interested plan (1 Month ₹499 or 1 Year ₹4,999).

Submitting validates the form and opens WhatsApp to +91 8088521053 with the request details prefilled. The visitor must press Send inside WhatsApp. This does **not** automatically transmit data, create a database record, collect payment, or send an admin invitation. No WhatsApp API credentials are required.

Implementation: `components/access-request.tsx`, imported by `app/page.tsx`. To change the destination, edit the WhatsApp number in the component. To change prices, update both this component and the pricing cards on the landing page.

For deployment, preserve your existing `.env` values and run `npm install && npm run build` before pushing to GitHub. No database migration is required.
