import { AdminCompetitionManager } from "@/components/admin/AdminCompetitionManager";
import { COMPETITIONS } from "@/lib/data/competitions";
import { requireAdminSession } from "@/lib/auth";
import { getCompetitionsFromBackend } from "@/lib/utils/backend";

export default async function AdminPanelPage() {
  await requireAdminSession();
  const competitionResult = await getCompetitionsFromBackend(COMPETITIONS);

  return (
    <AdminCompetitionManager
      initialCompetitions={competitionResult.competitions}
      dataStatusMessage={competitionResult.errorMessage}
    />
  );
}
