import type { CompetitionSubmission } from "@/lib/types";
import { formatDate } from "@/lib/utils/competitions";
import {
  formatDateTime,
  getSubmissionStatusClassName,
  getSubmissionStatusLabel,
} from "@/components/admin/AdminCompetitionManager.utils";

interface AdminSubmissionReviewPanelProps {
  submissions: CompetitionSubmission[];
  submissionMessage: string;
  submissionStatusMessage?: string | null;
  isMutationPending: boolean;
  onApproveSubmission: (submissionId: string) => void;
  onRejectSubmission: (submissionId: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
}

export function AdminSubmissionReviewPanel({
  submissions,
  submissionMessage,
  submissionStatusMessage = null,
  isMutationPending,
  onApproveSubmission,
  onRejectSubmission,
  onDeleteSubmission,
}: AdminSubmissionReviewPanelProps) {
  return (
    <section className="grid gap-4">
      {submissionStatusMessage ? (
        <section className="rounded-[1.25rem] border border-amber-200/14 bg-amber-200/8 px-4 py-3 text-sm text-amber-50 backdrop-blur-md sm:px-5">
          <p>{submissionStatusMessage}</p>
        </section>
      ) : null}

      <section className="rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/8 pb-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Pengajuan masuk
          </p>
          <h2 className="font-brand text-[1.75rem] leading-tight text-zinc-50 sm:text-[2rem]">
            Review pengajuan dari publik
          </h2>
          <p className="text-sm text-zinc-400">{submissionMessage}</p>
        </div>

        <div className="mt-5 grid gap-4">
          {submissions.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">
              Belum ada pengajuan yang masuk.
            </div>
          ) : (
            submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-zinc-100">
                      {submission.name}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {submission.organizer} • {submission.category}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Pengaju: {submission.submitterName} ({submission.submitterEmail})
                    </p>
                    <p className="text-xs text-zinc-500">
                      Dikirim: {formatDateTime(submission.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getSubmissionStatusClassName(
                      submission.status,
                    )}`}
                  >
                    {getSubmissionStatusLabel(submission.status)}
                  </span>
                </div>

                {submission.notes ? (
                  <p className="mt-3 rounded-[0.9rem] border border-white/8 bg-black/10 px-3 py-2 text-sm text-zinc-300">
                    {submission.notes}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span>Deadline: {formatDate(submission.regEnd)}</span>
                  <span>
                    Review:{" "}
                    {submission.reviewedAt
                      ? formatDateTime(submission.reviewedAt)
                      : "Belum direview"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {submission.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={isMutationPending}
                        onClick={() => onApproveSubmission(submission.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300/22 bg-emerald-300/12 px-4 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/32 hover:bg-emerald-300/18 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Terima
                      </button>
                      <button
                        type="button"
                        disabled={isMutationPending}
                        onClick={() => onRejectSubmission(submission.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-rose-300/22 bg-rose-300/12 px-4 text-sm font-medium text-rose-100 transition hover:border-rose-300/32 hover:bg-rose-300/18 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Tolak
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    disabled={isMutationPending}
                    onClick={() => onDeleteSubmission(submission.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300/22 bg-zinc-300/12 px-4 text-sm font-medium text-zinc-100 transition hover:border-zinc-300/34 hover:bg-zinc-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
