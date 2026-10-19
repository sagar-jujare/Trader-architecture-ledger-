# Broker account options

This release adds a "Broker account options" section to the public landing page and to the active member's dashboard. It also changes the public CTA wording from "Request invitation" to "Request access". Existing invitation and subscription workflows are unchanged.

## Configure account-opening links

The public buttons default to official provider websites. To use your specific account-opening campaign links, set the following in `.env` and in Vercel Environment Variables:

```env
NEXT_PUBLIC_DHAN_ACCOUNT_URL="https://your-approved-dhan-link"
NEXT_PUBLIC_SAHI_ACCOUNT_URL="https://your-approved-sahi-link"
NEXT_PUBLIC_INDMONEY_ACCOUNT_URL="https://your-approved-indmoney-link"
```

These URLs are exposed publicly because users navigate to them. Only use approved URLs. Restart Next.js / redeploy after changes.

The displayed logos are requested at runtime through Google's public favicon service; they need internet access and are not bundled as trademark files. Replace with properly licensed official logo assets if desired.

Broker feature descriptions are general; confirm latest pricing, eligibility and availability on each provider's official website. A disclosure notes possible compensation from account-opening links. No guaranteed trading performance is claimed.

No database migration is required.
