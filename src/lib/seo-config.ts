export type DeploymentEnvironment = 'local' | 'staging' | 'production';

const configuredEnvironment = process.env.DEPLOY_ENV;
const configuredOrigins: Record<DeploymentEnvironment, string> = {
  local: 'http://localhost:3000',
  staging: 'https://staging.siamrooftech.com',
  production: 'https://www.siamrooftech.com',
};

function getDeploymentEnvironment(): DeploymentEnvironment {
  if (configuredEnvironment === 'local' || configuredEnvironment === 'staging' || configuredEnvironment === 'production') {
    return configuredEnvironment;
  }
  if (process.env.NODE_ENV !== 'production') return 'local';
  throw new Error('DEPLOY_ENV must explicitly be local, staging, or production.');
}

export const DEPLOYMENT_ENV = getDeploymentEnvironment();
export const SITE_URL = process.env.SITE_ORIGIN || configuredOrigins[DEPLOYMENT_ENV];
if (new URL(SITE_URL).origin !== configuredOrigins[DEPLOYMENT_ENV]) {
  throw new Error(`SITE_ORIGIN does not match the configured ${DEPLOYMENT_ENV} deployment origin.`);
}
export const IS_INDEXABLE_ENVIRONMENT = DEPLOYMENT_ENV === 'production';

export const SERVICE_AREAS_TH = [
  'กรุงเทพ',
  'นครปฐม',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'อยุธยา',
  'สมุทรสาคร',
] as const;

export function canonicalUrl(path = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === '/' ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

export function toDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
