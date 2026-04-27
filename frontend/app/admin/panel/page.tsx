import { AdminCompetitionManager } from "@/components/admin/AdminCompetitionManager";
import { requireAdminSession } from "@/lib/auth";
import { getCompetitionsFromBackend } from "@/lib/utils/backend";
import { getSubmissionsFromBackend } from "@/lib/utils/submissions";

export default async function AdminPanelPage() {
  await requireAdminSession();
  const competitionResult = await getCompetitionsFromBackend();
  const submissionResult = await getSubmissionsFromBackend();

  return (
    <AdminCompetitionManager
      initialCompetitions={competitionResult.competitions}
      dataStatusMessage={competitionResult.errorMessage}
      initialSubmissions={submissionResult.submissions}
      submissionStatusMessage={submissionResult.errorMessage}
    />
  );
}
