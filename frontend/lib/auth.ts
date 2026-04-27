import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "compbase_admin_session";

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim() || "admin@compbase.id";
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "compbase-admin";
}

function createSessionValue(): string {
  const rawValue = `${getAdminEmail()}:${getAdminPassword()}`;

  return Buffer.from(rawValue).toString("base64url");
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email.trim() === getAdminEmail() && password === getAdminPassword();
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return sessionCookie === createSessionValue();
}

export async function requireAdminSession(): Promise<void> {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin");
  }
}
