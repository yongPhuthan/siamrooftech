/** Shared claim contract; authentication alone never grants CMS access. */
export function hasAdminRole(claims: Readonly<Record<string, unknown>>): boolean {
  return claims.admin === true;
}
