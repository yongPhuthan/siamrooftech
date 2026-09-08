# LINE Contact Funnel — Critical Contract

These instructions apply to every file in this directory. The root `AGENTS.md`
also requires every LINE-contact consumer elsewhere in the repository to use
this feature's public contract.

## Non-negotiable destination

- Every user-facing LINE contact CTA must render a normal anchor whose exact
  destination is `https://lin.ee/pPz1ZqN`, exported as `LINE_CONTACT_URL` from
  `constants.ts`.
- Never send a contact click to `line.me/en`, `www.line.me/en`,
  `line.me/R/oaMessage`, a generated LINE deep link, an internal redirect, or a
  measurement proxy. The generic LINE homepage is always a P0 failure.
- Do not accept an arbitrary LINE destination through component props. A
  destination change requires explicit user approval and successful real-device
  QA on iOS, Android, and desktop before release.

## Zero-friction interaction contract

- LINE contact uses native anchor navigation. Never call `preventDefault()`,
  `stopPropagation()`, `window.open()`, `router.push()`, or mutate `href` in a
  LINE click path.
- Never put a survey, form, modal, login, confirmation, loading state, or awaited
  network request between the click and LINE. If a survey is ever reintroduced,
  it must be optional and must not run before or block the native handoff.
- Analytics and lead intake are secondary diagnostics. They must be
  fire-and-forget, tolerate JavaScript/API failure, and never determine whether
  navigation occurs.
- Prefer a server-rendered `<a href={LINE_CONTACT_URL}>` for public pages. Keep
  client JavaScript limited to non-blocking measurement or sticky-button
  visibility.
- Server-side code or Cloudflare Workers may process intake and conversion data
  out of band, but the CTA must never navigate through a server, Function, or
  Worker first.

## Ownership

- `constants.ts`: the only production-source literal for the verified URL.
- `LineContactButton.tsx`: shared semantic CTA primitive.
- `LineButtonDesktop.tsx`, `LineButtonMobile.tsx`, and `LineButtonsLayout.tsx`:
  responsive floating/sticky presentation only.
- `LineLeadCapture.tsx` and `lead-intake.ts`: non-blocking diagnostics only; they
  must not control navigation.
- Other pages may customize labels and appearance, but must import
  `LINE_CONTACT_URL` or use `LineContactButton` and preserve this contract.

## Required verification

- Run `yarn line-contact:qa`, `yarn type-check`, `yarn lint`, and `yarn build`
  after any LINE-contact change.
- Run `yarn ads:browser-qa` against the built site and production. The browser
  assertion must use the independent literal `https://lin.ee/pPz1ZqN`, not the
  exported constant.
- QA must prove: one click, no dialog, exact native destination, no href rewrite,
  and successful navigation even when intake/analytics fail.
- Real-device iOS and Android verification is mandatory before changing the
  destination or navigation mechanism.
- Do not ship if `line.me/en` or `line.me/R/oaMessage` appears in production
  source, or if any contact click depends on measurement succeeding.
