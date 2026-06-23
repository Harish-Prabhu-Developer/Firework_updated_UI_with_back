import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function fixSellingPrice() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        // Make selling_price nullable so Drizzle inserts (which omit it) succeed
        await pool.query(`ALTER TABLE products ALTER COLUMN selling_price DROP NOT NULL`);
        console.log('✅  selling_price is now nullable — Drizzle inserts will succeed.');

        // Verify
        const res = await pool.query(`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'selling_price'
        `);
        console.table(res.rows);
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixSellingPrice();
