# Repository guidance

@AGENTS.md

Follow the root `AGENTS.md` above and any narrower `AGENTS.md` beside the files being changed. Each folder with its own `AGENTS.md` also has a `CLAUDE.md` that imports it, so those rules load when you open a file there. The local app uses Next.js, Better Auth, Cloudflare D1, Drizzle, R2, and OpenNext. Keep deployment and external service changes out of scope unless explicitly requested.
