import {
  createSupabaseClientForMigration,
  getSupabaseCompetitionTableName,
  mapCompetitionToSupabaseRow,
  readLocalCompetitionsForMigration,
} from "./dataStore.js";

async function migrateLocalCompetitionsToSupabase(): Promise<void> {
  const competitions = await readLocalCompetitionsForMigration();

  if (competitions.length === 0) {
    console.log("Tidak ada data lokal yang perlu dimigrasikan.");
    return;
  }

  const supabase = createSupabaseClientForMigration();
  const tableName = getSupabaseCompetitionTableName();
  const payload = competitions.map(mapCompetitionToSupabaseRow);

  const { error } = await supabase.from(tableName).upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Migrasi ke Supabase gagal: ${error.message}`);
  }

  console.log(
    `${competitions.length} kompetisi lokal berhasil dimigrasikan ke Supabase.`,
  );
}

void migrateLocalCompetitionsToSupabase().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Migrasi ke Supabase gagal.";
  console.error(message);
  process.exitCode = 1;
});
