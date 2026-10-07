# Public UI primitives

## Scope

Server-safe visual primitives for public pages. Admin components remain owned by `src/components/ui`.

## Inherited Instructions

Read the [parent instructions](../../../../AGENTS.md) first. The root public UI ownership rules still apply.

## Local Rules

- Accept typed props and named variants; do not fetch data or encode page-specific business decisions.
- Keep the default export server-compatible. Add a client boundary only for an interaction that cannot be expressed with native HTML.
- Use `site-*` tokens and semantic HTML. Do not add raw brand colors to a primitive.

## Dependencies

- May import `cn`, `cva`, `next/link`, and server-safe React/Next primitives.
- Must not import admin components, route handlers, database adapters, or feature state.

## Verification

- Run `yarn type-check`, `yarn lint`, and `yarn ui:qa` after changing a primitive.

## Zoom Out

[Root instructions](../../../../AGENTS.md)
