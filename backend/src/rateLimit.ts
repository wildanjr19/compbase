import type { IncomingMessage } from "node:http";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastSeenAt: number;
}

const store = new Map<string, RateLimitEntry>();
const PRUNE_INTERVAL_MS = 60_000;
const MAX_STORE_ENTRIES = 50_000;
let lastPruneAt = 0;

function pruneExpiredEntries(now: number): void {
  if (now - lastPruneAt < PRUNE_INTERVAL_MS && store.size < MAX_STORE_ENTRIES) {
    return;
  }

  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }

  if (store.size > MAX_STORE_ENTRIES) {
    const entries = Array.from(store.entries()).sort(
      (first, second) => first[1].lastSeenAt - second[1].lastSeenAt,
    );
    const overflowCount = store.size - MAX_STORE_ENTRIES;

    for (let index = 0; index < overflowCount; index += 1) {
      const key = entries[index]?.[0];
      if (key) {
        store.delete(key);
      }
    }
  }

  lastPruneAt = now;
}

function isProxyTrusted(): boolean {
  return process.env.BACKEND_TRUST_PROXY?.trim().toLowerCase() === "true";
}

function normalizeIp(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "unknown";

  return normalizedValue.startsWith("::ffff:")
    ? normalizedValue.replace("::ffff:", "")
    : normalizedValue;
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  pruneExpiredEntries(now);
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      lastSeenAt: now,
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    entry.lastSeenAt = now;
    return { allowed: false, retryAfter };
  }

  entry.count++;
  entry.lastSeenAt = now;
  return { allowed: true };
}

function getClientIp(req: IncomingMessage): string {
  if (isProxyTrusted()) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return normalizeIp(forwarded.split(",")[0] ?? "");
    }
    if (Array.isArray(forwarded)) {
      return normalizeIp(forwarded[0] ?? "");
    }
  }

  const remoteAddress = req.socket?.remoteAddress ?? "unknown";
  return normalizeIp(remoteAddress);
}

export function getRateLimitKey(req: IncomingMessage, suffix: string): string {
  return `${getClientIp(req)}:${suffix}`;
}
