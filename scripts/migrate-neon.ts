import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta la variable DATABASE_URL (defínela en .env)");
    process.exit(1);
  }
  const sql = postgres(url);

  try {
    await sql.unsafe(
      'ALTER TABLE "Experiment" ADD COLUMN IF NOT EXISTS "agitation" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "temperature" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "ph" DOUBLE PRECISION'
    );
    console.log("Migration OK");
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

main();
