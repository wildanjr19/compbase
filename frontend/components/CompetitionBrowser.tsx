"use client";

import { useState } from "react";
import { CompetitionDetailModal } from "@/components/CompetitionDetailModal";
import { CompetitionGrid } from "@/components/CompetitionGrid";
import { SpotlightSection } from "@/components/SpotlightSection";
import type { Competition } from "@/lib/types";

interface CompetitionBrowserProps {
  competitions: Competition[];
  spotlightCompetitions: Competition[];
  now: Date;
  showSpotlight?: boolean;
  showGrid?: boolean;
}

const INITIAL_VISIBLE_COMPETITIONS = 6;

export function CompetitionBrowser({
  competitions,
  spotlightCompetitions,
  now,
  showSpotlight = true,
  showGrid = true,
}: CompetitionBrowserProps) {
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [showAllCompetitions, setShowAllCompetitions] = useState<boolean>(false);
  const visibleCompetitions = showAllCompetitions
    ? competitions
    : competitions.slice(0, INITIAL_VISIBLE_COMPETITIONS);
  const hiddenCompetitionsCount = Math.max(competitions.length - visibleCompetitions.length, 0);

  const handleOpenDetail = (competition: Competition): void => {
    setActiveCompetition(competition);
  };

  const handleCloseDetail = (): void => {
    setActiveCompetition(null);
  };

  return (
    <>
      {showSpotlight ? (
        <SpotlightSection
          competitions={spotlightCompetitions}
          now={now}
          onOpenDetail={handleOpenDetail}
        />
      ) : null}

      {showGrid ? (
        <CompetitionGrid
          competitions={visibleCompetitions}
          totalCompetitions={competitions.length}
          hiddenCompetitionsCount={hiddenCompetitionsCount}
          onShowAll={
            hiddenCompetitionsCount > 0
              ? (): void => {
                  setShowAllCompetitions(true);
                }
              : undefined
          }
          now={now}
          onOpenDetail={handleOpenDetail}
        />
      ) : null}

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
