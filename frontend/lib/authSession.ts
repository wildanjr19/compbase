import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface AdminCredentials {
  email: string;
  passwordHash: string | null;
}

const DEFAULT_ADMIN_EMAIL = "admin@compbase.id";
const SESSION_VERSION = 1;
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 jam
const SESSION_SECRET_SALT = "compbase-session-secret-v2";

function normalizeEnvValue(value: string | undefined, fallbackValue: string): string {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : fallbackValue;
}

export function resolveAdminCredentials(
  env: NodeJS.ProcessEnv = process.env,
): AdminCredentials {
  return {
    email: normalizeEnvValue(env.ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL),
    passwordHash: env.ADMIN_PASSWORD_HASH?.trim() || null,
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const parts = hash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;

    const [, salt, key] = parts;
    const expectedKey = Buffer.from(key, "hex");
    if (expectedKey.length !== 64) return false;

    const derived = scryptSync(password, salt, 64);
    if (derived.length !== expectedKey.length) return false;

    return timingSafeEqual(derived, expectedKey);
  } catch {
    return false;
  }
}

function getSessionSecret(credentials: AdminCredentials): string {
  const explicitSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicitSecret) return explicitSecret;

  if (credentials.passwordHash) {
    // Gunakan hash password sebagai sumber entropy jika session secret eksplisit tidak di-set.
    return scryptSync(credentials.passwordHash, SESSION_SECRET_SALT, 32).toString("hex");
  }

  // Tanpa ADMIN_PASSWORD_HASH dan ADMIN_SESSION_SECRET, session tidak valid.
  return "";
}

export function createSessionValue(credentials: AdminCredentials): string {
  const secret = getSessionSecret(credentials);
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = JSON.stringify({
    v: SESSION_VERSION,
    e: credentials.email,
    exp: expiresAt,
  });
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + signature;
}

export function isAdminSessionValueValid(
  sessionValue: string | undefined,
  credentials: AdminCredentials,
): boolean {
  if (!sessionValue) return false;
  const parts = sessionValue.split(".");
  if (parts.length !== 2) return false;
  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf8");
    const signature = parts[1];
    const data = JSON.parse(payload);
    if (
      data.v !== SESSION_VERSION ||
      typeof data.e !== "string" ||
      typeof data.exp !== "number"
    ) {
      return false;
    }
    if (data.e !== credentials.email) return false;
    if (Date.now() > data.exp) return false;
    const secret = getSessionSecret(credentials);
    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    if (signature.length !== expectedSig.length) return false;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function resolveAdminEmailFromSession(
  sessionValue: string | undefined,
  credentials: AdminCredentials,
): string | null {
  if (!sessionValue || !isAdminSessionValueValid(sessionValue, credentials)) return null;
  try {
    const parts = sessionValue.split(".");
    const payload = Buffer.from(parts[0], "base64url").toString("utf8");
    const data = JSON.parse(payload);
    return typeof data.e === "string" ? data.e : null;
  } catch {
    return null;
  }
}

export function validateAdminCredentialsInput(
  email: string,
  password: string,
  credentials: AdminCredentials,
): boolean {
  const normalizedEmail = email.trim();
  if (normalizedEmail !== credentials.email) return false;

  if (credentials.passwordHash) {
    return verifyPassword(password, credentials.passwordHash);
  }

  // Tanpa ADMIN_PASSWORD_HASH, login wajib gagal.
  return false;
}

