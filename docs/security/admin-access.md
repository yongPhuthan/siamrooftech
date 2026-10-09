# Admin account access

Reviewed: 2026-10-06. Authentication owner: `src/features/auth/`. API authorization owner: `src/lib/api-auth.ts`.

## Web registration and sign-in

Open an admin page, enter an approved email, request the six-digit code, and enter the code from that mailbox. The first successful verification creates a verified administrator account and a session; later visits use the same flow. Account creation does not require the CLI or a password.

Only addresses in the server-only `ADMIN_ALLOWED_EMAILS` configuration may use this flow. An absent or invalid allowlist fails closed. The browser cannot assign its own role. OTPs expire after five minutes, work once, and are stored as hashes. Five incorrect attempts invalidate a code. Resends require a persisted 60-second cooldown per mailbox; IP-level auth rate limits are stored in D1. Codes and email provider payloads are not logged or returned in API responses. Delivery failure returns an error rather than reporting success.

Unrestricted password signup remains disabled. Every administrative API requires a server-verified HttpOnly session and a persisted admin role; state-changing requests also require a same-origin request. Other OTP types and email changes are outside this registration flow.

## Configuration

The same code and form run in local, staging, and production. Each Worker deployment supplies its own D1, auth secret, exact base URL, and approved-mailbox configuration:

- `BETTER_AUTH_SECRET`: a random secret of at least 32 characters; Cloudflare Worker Secret for deployed environments.
- `BETTER_AUTH_URL`: the origin actually used to open that instance, including its local port.
- `ADMIN_ALLOWED_EMAILS`: comma-separated emails allowed to verify themselves as administrators; server configuration only.
- `AUTH_EMAIL_FROM`: an address on the configured sender domain.
- `AUTH_EMAIL`: native Cloudflare `send_email` binding. Staging binds its own databases and the same transactional email service.
- `AUTH_EMAIL_DELIVERY=live`: required to send. Default local/build configuration disables delivery, preventing simulated messages or console OTPs. The local Worker preview clones the configuration and enables a real remote email binding while keeping D1/R2 local.

Email Routing must be ready for the sender domain and the recipient must be a verified destination unless unrestricted Email Sending is enabled. No inbox password or user password belongs in environment files. No code is printed on screen or in logs as a substitute for email delivery.

`.dev.vars` holds ignored local configuration. `.dev.vars.example` contains placeholders. Apply migration `0002_auth_otp.sql` before using this flow. Build with `yarn cf:build`, then run `node scripts/preview-cms.mjs 3002` for the current local preview. The wrapper matches the auth origin to the chosen port without changing saved local config. Standard `yarn cf:preview` builds and runs the same preview on port 3000. A plain `yarn dev` does not send real emails unless its server configuration explicitly enables a real transport.

Generate scoped workerd/binding types with `yarn cf:types`; this avoids mixing Worker global types with Next.js DOM types.

Legacy local CLI account tools remain available for maintenance, but are not part of registration or ordinary sign-in.

## Editorial publication

Drafts and published snapshots remain separate inside a deployment environment. Registration does not publish content, deploy code, or change production databases. Private preview requires admin access. Saving an unfinished draft preserves the existing public snapshot; publication validates content before replacing it.

## Verification

`yarn test:admin` exercises the real Better Auth handler with isolated local D1 and a captured email transport, including verified signup/session, allowlist rejection, wrong/expired/replayed OTP, resend cooldown, and delivery failures. Component tests verify that failed sends never advance to a false success screen. These tests do not send real emails or prove deliverability; verify real delivery separately with the approved owner's mailbox.

Sources: [Better Auth Email OTP](https://www.better-auth.com/docs/plugins/email-otp), [Cloudflare email bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/), [Cloudflare local email delivery](https://developers.cloudflare.com/email-service/local-development/sending/).
