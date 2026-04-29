import { describe, expect, it } from "vitest";
import type { Competition } from "@/lib/types";
import {
  clampCompetitionPage,
  filterCompetitions,
  getCompetitionStatus,
  getDaysUntilDeadline,
  parseCompetitionFilters,
  sortCompetitions,
} from "@/lib/utils/competitions";

function createCompetition(
  partialCompetition: Partial<Competition> & Pick<Competition, "id" | "name">,
): Competition {
  return {
    id: partialCompetition.id,
    name: partialCompetition.name,
    slug: partialCompetition.slug ?? partialCompetition.name.toLowerCase(),
    organizer: partialCompetition.organizer ?? "Organizer",
    category: partialCompetition.category ?? "Data Science",
    regStart: partialCompetition.regStart ?? "",
    regEnd: partialCompetition.regEnd ?? "",
    eventStart: partialCompetition.eventStart ?? "",
    eventEnd: partialCompetition.eventEnd ?? "",
    isPriority: partialCompetition.isPriority ?? false,
    hasGuidebook: partialCompetition.hasGuidebook ?? false,
    links: partialCompetition.links ?? {},
  };
}

describe("parseCompetitionFilters", () => {
  it("menggunakan default page saat nilai page tidak valid", () => {
    const filters = parseCompetitionFilters({
      page: "abc",
      tab: "closing-soon",
      sort: "name",
    });

    expect(filters.page).toBe(1);
    expect(filters.tab).toBe("coming-soon");
    expect(filters.sort).toBe("name");
  });

  it("mengambil page valid dari query", () => {
    const filters = parseCompetitionFilters({
      page: "3",
      q: "datathon",
      category: "Hackathon",
    });

    expect(filters.page).toBe(3);
    expect(filters.query).toBe("datathon");
    expect(filters.category).toBe("Hackathon");
  });
});

describe("clampCompetitionPage", () => {
  it("mengembalikan halaman minimal 1", () => {
    expect(clampCompetitionPage(0, 40, 12)).toBe(1);
    expect(clampCompetitionPage(-2, 40, 12)).toBe(1);
  });

  it("meng-clamp ke halaman terakhir saat page melebihi total", () => {
    expect(clampCompetitionPage(99, 27, 12)).toBe(3);
  });
});

describe("sortCompetitions + filterCompetitions", () => {
  const now = new Date("2026-05-10T00:00:00.000Z");
  const competitions: Competition[] = [
    createCompetition({
      id: "cmp-001",
      name: "A Open",
      regStart: "2026-05-01",
      regEnd: "2026-05-15",
      eventStart: "2026-05-20",
      eventEnd: "2026-05-20",
    }),
    createCompetition({
      id: "cmp-002",
      name: "B Coming Soon",
      regStart: "2026-06-01",
      regEnd: "2026-06-20",
      eventStart: "2026-06-25",
      eventEnd: "2026-06-26",
    }),
    createCompetition({
      id: "cmp-003",
      name: "C Closed",
      regStart: "2026-04-01",
      regEnd: "2026-04-07",
      eventStart: "2026-04-10",
      eventEnd: "2026-04-11",
    }),
  ];

  it("menempatkan status open di depan coming-soon dan closed", () => {
    const sorted = sortCompetitions(competitions, "deadline", now);
    expect(sorted[0]?.id).toBe("cmp-001");
    expect(sorted[1]?.id).toBe("cmp-002");
    expect(sorted[2]?.id).toBe("cmp-003");
  });

  it("memfilter berdasarkan tab open", () => {
    const filtered = filterCompetitions(
      competitions,
      {
        query: "",
        category: "all",
        tab: "open",
        sort: "deadline",
        page: 1,
      },
      now,
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("cmp-001");
  });
});

describe("status dan deadline berbasis Asia/Jakarta", () => {
  it("tetap coming-soon jika regStart belum masuk tanggal pendaftaran", () => {
    const now = new Date("2026-05-09T16:00:00.000Z");
    const competition = createCompetition({
      id: "cmp-100",
      name: "Kompetisi Besok",
      regStart: "2026-05-10",
      regEnd: "2026-05-20",
    });

    expect(getCompetitionStatus(competition, now)).toBe("coming-soon");
  });

  it("menggunakan pergantian hari WIB untuk hitung sisa waktu", () => {
    const now = new Date("2026-05-09T17:30:00.000Z");
    const daysLeft = getDaysUntilDeadline("2026-05-10", now);

    expect(daysLeft).toBe(0);
  });
});
