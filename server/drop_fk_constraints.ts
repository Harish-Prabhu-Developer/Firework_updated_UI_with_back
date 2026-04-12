
import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function fixConstraints() {
  try {
    console.log("Dropping foreign key constraints from invoice_items and order_items...");
    
    // Drop constraints if they exist
    await db.execute(sql`
      ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_product_id_products_id_fk;
      ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_products_id_fk;
    `);
    
    console.log("Successfully dropped constraints.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

fixConstraints();
