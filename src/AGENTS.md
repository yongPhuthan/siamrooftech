# Code comment rules

These rules apply to code under `src/`, `scripts/`, and `workers/`. Read the [root rules](../AGENTS.md) first; feature folders under `src/features/` add their own rules.

- Write a comment only when it carries something the code cannot: intent, a constraint, a workaround, a warning, or a link to an issue or decision record.
- Describe the code as it is now, in the present tense. Change history belongs in commit messages.
- Keep existing comments when you refactor or clean up. When the code under a comment changes, update that comment in the same edit. If a comment is wrong, fix or remove it and mention that in your final message.
- Write TODOs with a tracking reference: `TODO(#123): ...`.
- Leave comments, docstrings, and type annotations in code you did not change as they are.
