/** Production destination stays fixed; a local build may use an explicit test OA. */
export const PRODUCTION_LINE_CONTACT_URL = 'https://lin.ee/pPz1ZqN' as const;
export const LINE_CONTACT_URL = process.env.DEPLOY_ENV === 'local'
  ? process.env.NEXT_PUBLIC_LINE_TEST_CONTACT_URL || PRODUCTION_LINE_CONTACT_URL
  : PRODUCTION_LINE_CONTACT_URL;
