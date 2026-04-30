import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionValue,
  isAdminSessionValueValid,
  resolveAdminCredentials,
  resolveAdminEmailFromSession,
  validateAdminCredentialsInput,
} from "@/lib/authSession";

const ADMIN_SESSION_COOKIE = "compbase_admin_session";

export function validateAdminCredentials(email: string, password: string): boolean {
  return validateAdminCredentialsInput(email, password, resolveAdminCredentials());
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const credentials = resolveAdminCredentials();

  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionValue(credentials), {
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
  const credentials = resolveAdminCredentials();

  return isAdminSessionValueValid(sessionCookie, credentials);
}

export async function requireAdminSession(): Promise<void> {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin");
  }
}

export async function getAdminEmailFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const credentials = resolveAdminCredentials();

  return resolveAdminEmailFromSession(sessionCookie, credentials);
}
