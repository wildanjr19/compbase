import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  isAdminSessionValueValid,
  resolveAdminCredentials,
  validateAdminCredentialsInput,
} from "@/lib/authSession";

describe("authSession helpers", () => {
  it("menggunakan fallback kredensial saat env kosong", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "",
      ADMIN_PASSWORD: "",
    });

    expect(credentials.email).toBe("admin@compbase.id");
    expect(credentials.password).toBe("compbase-admin");
  });

  it("memvalidasi kredensial input sesuai sumber env", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD: "rahasia-kuat",
    });

    expect(
      validateAdminCredentialsInput("admin@contoh.id", "rahasia-kuat", credentials),
    ).toBe(true);
    expect(
      validateAdminCredentialsInput("admin@contoh.id", "salah", credentials),
    ).toBe(false);
  });

  it("memvalidasi nilai cookie session admin", () => {
    const credentials = resolveAdminCredentials({
      ADMIN_EMAIL: "admin@contoh.id",
      ADMIN_PASSWORD: "rahasia-kuat",
    });
    const sessionValue = createSessionValue(credentials);

    expect(isAdminSessionValueValid(sessionValue, credentials)).toBe(true);
    expect(isAdminSessionValueValid("invalid", credentials)).toBe(false);
  });
});
