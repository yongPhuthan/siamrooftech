# Documentation rules

These rules apply to every file under `docs/`. Read the [root rules](../AGENTS.md) first.

## Writing and updating docs

- Docs describe the current state. When something changes, replace the outdated text where it stands. Git holds the history.
- State each rule or fact in one place and link to it from elsewhere.
- Edit the existing document for the topic. Add a new file only when the user asks for one or no document covers the topic yet.
- When you mention an old pattern, write the current way first, give the reason, then name where the legacy code or doc lives.
- Folders named `archive-*` are history only. Current guidance lives outside them; leave archived files unchanged.
- PR descriptions for doc changes say why the doc changed and what it now states.

## Decision records

- A decision record starts with a `Status:` line: `Accepted`, `Proposed`, or `Superseded by <record>`.
- Accepted records are binding. Proposed records are context. Superseded records are history only.
- If a task conflicts with an accepted record, stop and propose a change to the record before writing code.
- To reverse a decision, write a new record and set the old record's `Status:` to `Superseded by <record>`, in the same change as the code.
- Keep records short. A substantive edit adds one `Updated: YYYY-MM-DD` line.
