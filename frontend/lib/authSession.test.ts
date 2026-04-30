import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  hashPassword,
  isAdminSessionValueValid,
  resolveAdminCredentials,
  validateAdminCredentialsInput,
  verifyPassword,
} from "@/lib/authSession";

describe("authSession helpers", () => {
  it("menggunakan fallback email default saat env kosong", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "",
      ADMIN_PASSWORD_HASH: "",
    });

    expect(credentials.email).toBe("admin@compbase.id");
    expect(credentials.passwordHash).toBeNull();
  });

  it("login wajib gagal jika ADMIN_PASSWORD_HASH tidak di-set", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD_HASH: "",
    });

    expect(
      validateAdminCredentialsInput("admin@contoh.id", "rahasia-kuat", credentials),
    ).toBe(false);
  });

  it("memvalidasi kredensial input dengan hash scrypt", () => {
    const password = "rahasia-kuat";
    const passwordHash = hashPassword(password);
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD_HASH: passwordHash,
    });

    expect(credentials.passwordHash).not.toBeNull();
    expect(verifyPassword(password, passwordHash)).toBe(true);
    expect(
      validateAdminCredentialsInput("admin@contoh.id", password, credentials),
    ).toBe(true);
    expect(
      validateAdminCredentialsInput("admin@contoh.id", "salah", credentials),
    ).toBe(false);
  });

  it("mengembalikan false saat hash password tidak valid", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD_HASH: "scrypt$invalid-salt$zz",
    });

    expect(
      validateAdminCredentialsInput("admin@contoh.id", "rahasia-kuat", credentials),
    ).toBe(false);
  });

  it("memvalidasi nilai cookie session admin", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD_HASH: hashPassword("rahasia-kuat"),
    });
    const sessionValue = createSessionValue(credentials);

    expect(isAdminSessionValueValid(sessionValue, credentials)).toBe(true);
    expect(isAdminSessionValueValid("invalid", credentials)).toBe(false);
    expect(isAdminSessionValueValid(undefined, credentials)).toBe(false);
    expect(
      isAdminSessionValueValid(`${sessionValue.slice(0, -1)}x`, credentials),
    ).toBe(false);
  });
});
