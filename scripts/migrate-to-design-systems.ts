/**
 * Migration Script: Library Data to Design Systems
 * 
 * This script migrates existing library_data from generations table
 * to the new Design Systems architecture.
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-design-systems.ts
 * 
 * Prerequisites:
 *   - Run the SQL migration (019_migrate_library_to_ds.sql) first
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MigrationResult {
  generation_id: string;  // TEXT in database
  design_system_id: string | null;  // UUID in database
  status: string;
}

async function main() {
  console.log("========================================");
  console.log("Library Data → Design Systems Migration");
  console.log("========================================\n");

  // Check if there are generations to migrate
  const { count, error: countError } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .not("library_data", "is", null)
    .is("design_system_id", null);

  if (countError) {
    console.error("Error checking generations:", countError);
    process.exit(1);
  }

  console.log(`Found ${count || 0} generations with library_data to migrate.\n`);

  if (!count || count === 0) {
    console.log("✓ Nothing to migrate. All generations are up to date.");
    return;
  }

  // Confirm before proceeding
  console.log("This will:");
  console.log("  1. Create Design Systems for users without one");
  console.log("  2. Migrate components from library_data to Design System");
  console.log("  3. Link generations to their Design System");
  console.log("");

  // Run the migration using the SQL function
  console.log("Running migration...\n");

  const { data, error } = await supabase.rpc("run_library_to_ds_migration");

  if (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  const results = data as MigrationResult[];

  // Count results
  const migrated = results.filter((r) => r.status === "migrated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status.startsWith("error")).length;

  console.log("Migration Results:");
  console.log("─────────────────");
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log("");

  // Show errors if any
  if (errors > 0) {
    console.log("Errors:");
    results
      .filter((r) => r.status.startsWith("error"))
      .forEach((r) => {
        console.log(`  - Generation ${r.generation_id}: ${r.status}`);
      });
    console.log("");
  }

  // Show summary of created Design Systems
  const { data: dsCount } = await supabase
    .from("design_systems")
    .select("id", { count: "exact", head: true });

  const { data: compCount } = await supabase
    .from("design_system_components")
    .select("id", { count: "exact", head: true });

  console.log("Database Summary:");
  console.log("─────────────────");
  console.log(`  Design Systems: ${dsCount || "N/A"}`);
  console.log(`  Components:     ${compCount || "N/A"}`);
  console.log("");

  if (errors > 0) {
    console.log("⚠ Migration completed with errors.");
    process.exit(1);
  } else {
    console.log("✓ Migration completed successfully!");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
