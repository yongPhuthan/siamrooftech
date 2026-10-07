export function createHeadingId(): string {
  return `section-${globalThis.crypto.randomUUID()}`;
}
