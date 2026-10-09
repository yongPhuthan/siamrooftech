# Public site patterns

## Scope

Shared navigation, breadcrumb, footer, CTA, and article presentation patterns used by public routes.

## Inherited Instructions

Read the [parent instructions](../../../AGENTS.md) first. The public UI rules from the root still apply.

## Local Rules

- Patterns compose public primitives and receive content or callbacks through typed props.
- Preserve semantic landmarks, native links, focus states, and the existing LINE contact contract.
- Do not resolve CMS data or business rules inside a pattern.

## Dependencies

- May import from `src/components/ui/public` and the LINE contact feature's public contract.
- Must not import admin code or server-only data adapters into client patterns.

## Verification

- Run the public route smoke checks, `yarn ui:qa`, and browser checks for changed interactions.

## Zoom Out

[Root instructions](../../../AGENTS.md)
