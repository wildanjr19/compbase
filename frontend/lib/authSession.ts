export interface AdminCredentials {
  email: string;
  password: string;
}

const DEFAULT_ADMIN_EMAIL = "admin@compbase.id";
const DEFAULT_ADMIN_PASSWORD = "compbase-admin";

function normalizeEnvValue(value: string | undefined, fallbackValue: string): string {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : fallbackValue;
}

export function resolveAdminCredentials(
  env: NodeJS.ProcessEnv = process.env,
): AdminCredentials {
  return {
    email: normalizeEnvValue(env.ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL),
    password: normalizeEnvValue(env.ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD),
  };
}

export function createSessionValue(credentials: AdminCredentials): string {
  const rawValue = `${credentials.email}:${credentials.password}`;
  return Buffer.from(rawValue).toString("base64url");
}

export function validateAdminCredentialsInput(
  email: string,
  password: string,
  credentials: AdminCredentials,
): boolean {
  return email.trim() === credentials.email && password === credentials.password;
}

export function isAdminSessionValueValid(
  sessionValue: string | undefined,
  credentials: AdminCredentials,
): boolean {
  if (!sessionValue) {
    return false;
  }

  return sessionValue === createSessionValue(credentials);
}
