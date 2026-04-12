
import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function checkConstraints() {
  try {
    const columns = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'invoice_items';
    `);
    console.log("\nColumns Table invoice_items:");
    console.log(JSON.stringify(columns.rows, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkConstraints();
