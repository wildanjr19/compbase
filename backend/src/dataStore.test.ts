import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCompetitionStore } from "./dataStore.ts";
import type { CompetitionSubmission } from "./submission.ts";

function createSubmission(
  partialSubmission: Partial<CompetitionSubmission> & Pick<CompetitionSubmission, "id" | "name">,
): CompetitionSubmission {
  const timestamp = "2026-04-28T10:00:00.000Z";

  return {
    id: partialSubmission.id,
    name: partialSubmission.name,
    slug: partialSubmission.slug ?? "sample-slug",
    organizer: partialSubmission.organizer ?? "Organizer",
    category: partialSubmission.category ?? "Data Science",
    regStart: partialSubmission.regStart ?? "2026-04-01",
    regEnd: partialSubmission.regEnd ?? "2026-04-20",
    eventStart: partialSubmission.eventStart ?? "2026-04-21",
    eventEnd: partialSubmission.eventEnd ?? "2026-04-22",
    isPriority: partialSubmission.isPriority ?? false,
    hasGuidebook: partialSubmission.hasGuidebook ?? false,
    links: partialSubmission.links ?? {},
    submitterName: partialSubmission.submitterName ?? "Tester",
    submitterEmail: partialSubmission.submitterEmail ?? "tester@mail.com",
    notes: partialSubmission.notes ?? "",
    status: partialSubmission.status ?? "pending",
    paymentStatus: partialSubmission.paymentStatus ?? "waived",
    reviewedBy: partialSubmission.reviewedBy ?? "",
    reviewedAt: partialSubmission.reviewedAt ?? "",
    createdAt: partialSubmission.createdAt ?? timestamp,
    updatedAt: partialSubmission.updatedAt ?? timestamp,
  };
}

describe("createCompetitionStore (local store)", () => {
  const originalEnv = { ...process.env };
  let tempDirectoryPath = "";
  let competitionsFilePath = "";
  let submissionsFilePath = "";

  beforeEach(async () => {
    tempDirectoryPath = await mkdtemp(join(tmpdir(), "compbase-store-test-"));
    competitionsFilePath = join(tempDirectoryPath, "competitions.json");
    submissionsFilePath = join(tempDirectoryPath, "submissions.json");

    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.LOCAL_COMPETITIONS_FILE_PATH = competitionsFilePath;
    process.env.LOCAL_SUBMISSIONS_FILE_PATH = submissionsFilePath;
  });

  afterEach(async () => {
    process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
    process.env.LOCAL_COMPETITIONS_FILE_PATH = originalEnv.LOCAL_COMPETITIONS_FILE_PATH;
    process.env.LOCAL_SUBMISSIONS_FILE_PATH = originalEnv.LOCAL_SUBMISSIONS_FILE_PATH;

    if (tempDirectoryPath) {
      await rm(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  it("approve submission mengubah status submission dan membuat competition baru", async () => {
    const pendingSubmission = createSubmission({
      id: "sub-001",
      name: "Kompetisi Baru",
      status: "pending",
      paymentStatus: "waived",
    });

    await writeFile(
      submissionsFilePath,
      JSON.stringify([pendingSubmission], null, 2),
      "utf8",
    );
    await writeFile(competitionsFilePath, "[]", "utf8");

    const store = createCompetitionStore();
    const approvedCompetition = await store.approveSubmission("sub-001");

    expect(approvedCompetition.id).toBe("cmp-001");
    expect(approvedCompetition.name).toBe("Kompetisi Baru");

    const submissionsContent = await readFile(submissionsFilePath, "utf8");
    const savedSubmissions = JSON.parse(submissionsContent) as CompetitionSubmission[];
    expect(savedSubmissions[0]?.status).toBe("approved");
    expect(savedSubmissions[0]?.reviewedAt).not.toBe("");
  });

  it("reject submission gagal ketika submission sudah direview", async () => {
    const reviewedSubmission = createSubmission({
      id: "sub-002",
      name: "Kompetisi Reviewed",
      status: "approved",
      reviewedAt: "2026-04-29T00:00:00.000Z",
    });

    await writeFile(
      submissionsFilePath,
      JSON.stringify([reviewedSubmission], null, 2),
      "utf8",
    );
    await writeFile(competitionsFilePath, "[]", "utf8");

    const store = createCompetitionStore();

    await expect(store.rejectSubmission("sub-002")).rejects.toThrow(
      "sudah pernah direview",
    );
  });

  it("approve submission gagal jika ID tidak ditemukan", async () => {
    await writeFile(submissionsFilePath, "[]", "utf8");
    await writeFile(competitionsFilePath, "[]", "utf8");

    const store = createCompetitionStore();

    await expect(store.approveSubmission("sub-404")).rejects.toThrow(
      "tidak ditemukan",
    );
  });
});
