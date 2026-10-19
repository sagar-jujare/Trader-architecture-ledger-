# Phase 7 — Invitation delivery and loading feedback

## Why invitations were not arriving

Earlier versions only created an invitation token in the database and displayed a link in the admin page. They did **not** call an email or WhatsApp provider. This release adds real provider integrations and honest delivery status reporting.

## Email (recommended)

1. Create a Resend account and verify a domain you own.
2. Add `RESEND_API_KEY` and `INVITE_FROM_EMAIL` to `.env` and to Vercel environment variables.
3. Set `APP_URL` to your **public HTTPS site URL** in production, e.g. `https://your-site.vercel.app`. A `localhost` invite URL will not work for remote recipients.
4. Restart the server, then create a *new* invitation. Check delivery status shown in the admin dashboard.

The API response confirms the provider accepted the email request, **not** that the recipient read or received it. Check the provider's delivery logs and DNS configuration for delivery failures.

## WhatsApp

There are two modes:

- **Manual (works without an API):** after inviting a trader, click **Open WhatsApp chat** in the success panel. The chat opens with a prefilled invite message; you must press Send. The trader's phone number should include country code, e.g. `+91...`.
- **Automatic:** configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_INVITE_TEMPLATE`, and optionally `WHATSAPP_TEMPLATE_LANGUAGE`. The named template must be approved in Meta WhatsApp Manager and have **two body text parameters**: the trader's name and invitation URL. The business must have appropriate consent to message the recipient. WhatsApp API acceptance is not a delivery/read guarantee.

The existing `+91 8088521053` WhatsApp support link on the login page remains separate from the recipient's invitation chat.

## Loading

`app/loading.tsx` shows a spinner during App Router route transitions and loading. The `SubmitButton` component uses React's `useFormStatus` to disable the button and show an inline spinner while server actions run. This prevents repeated clicks while the action is pending.

## Database

No Prisma schema changes are required. Do **not** run `prisma migrate reset`.

## Important operational notes

- If a provider fails, the invitation remains created and the admin can copy/share its link from the redirect. The system does not falsely claim it was sent.
- Links are sensitive one-time credentials. The existing admin success flow includes the token in the admin URL; avoid sharing that URL or storing it in analytics/logs. For production hardening, use a server-side flash message or a secure admin-only delivery view rather than query parameters.
- The current flow does not provide a resend action for existing invitations; create a new invitation for a different email or add an explicit resend workflow before attempting to re-invite the same address.
