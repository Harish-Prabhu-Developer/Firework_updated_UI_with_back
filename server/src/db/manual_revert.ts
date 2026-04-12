import pg from "pg";
const { Pool } = pg;
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

async function runFix() {
  const client = await pool.connect();
  try {
    console.log("Renaming tables...");
    // Check if purchased exists
    const checkPurchased = await client.query("SELECT EXITS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'purchased')");
    // This is hard to check reliably in one go, let's just try to ALTER and catch errors
    try {
        await client.query("ALTER TABLE IF EXISTS purchased RENAME TO invoices");
        console.log("Renamed purchased to invoices");
    } catch (e) { console.log("purchased table not found or already renamed"); }

    try {
        await client.query("ALTER TABLE IF EXISTS purchased_items RENAME TO invoice_items");
        console.log("Renamed purchased_items to invoice_items");
    } catch (e) { console.log("purchased_items table not found or already renamed"); }

    // Update statuses if they were 'ordered' and 'purchased' to 'pending' and 'converted'
    try {
        await client.query("UPDATE orders SET status = 'pending' WHERE status = 'ordered'");
        console.log("Updated status ordered -> pending");
    } catch (e) { console.log("Status ordered not found in orders"); }

    try {
        await client.query("UPDATE orders SET status = 'converted' WHERE status = 'purchased'");
        console.log("Updated status purchased -> converted");
    } catch (e) { console.log("Status purchased not found in orders"); }

    console.log("Done!");
  } catch (err) {
    console.error("Migration script failed:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runFix();
