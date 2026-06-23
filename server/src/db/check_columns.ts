import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const { Pool } = pg;

async function checkColumns() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'products'
            ORDER BY ordinal_position
        `);
        console.log('--- PRODUCTS TABLE COLUMNS ---');
        console.table(res.rows);

        // Also try a simple insert to see exact error
        const catRes = await pool.query(`SELECT id FROM category LIMIT 1`);
        console.log('\n--- FIRST CATEGORY ---');
        console.table(catRes.rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkColumns();
