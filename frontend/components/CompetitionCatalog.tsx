"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CompetitionDetailModal } from "@/components/CompetitionDetailModal";
import { CompetitionGrid } from "@/components/CompetitionGrid";
import { SpotlightSection } from "@/components/SpotlightSection";
import type { Competition } from "@/lib/types";

interface CompetitionCatalogProps {
  competitions: Competition[];
  spotlightCompetitions: Competition[];
  totalCompetitions: number;
  now: Date;
  children?: ReactNode;
}

export function CompetitionCatalog({
  competitions,
  spotlightCompetitions,
  totalCompetitions,
  now,
  children,
}: CompetitionCatalogProps) {
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(
    null,
  );

  const handleOpenDetail = (competition: Competition): void => {
    setActiveCompetition(competition);
  };

  const handleCloseDetail = (): void => {
    setActiveCompetition(null);
  };

  return (
    <>
      <SpotlightSection
        competitions={spotlightCompetitions}
        now={now}
        onOpenDetail={handleOpenDetail}
      />

      {children}

      <CompetitionGrid
        competitions={competitions}
        totalCompetitions={totalCompetitions}
        now={now}
        onOpenDetail={handleOpenDetail}
      />

      {activeCompetition ? (
        <CompetitionDetailModal
          competition={activeCompetition}
          now={now}
          onClose={handleCloseDetail}
        />
      ) : null}
    </>
  );
}
