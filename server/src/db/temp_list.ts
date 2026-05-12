
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function listTables() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('--- TABLES IN DATABASE ---');
        console.table(res.rows);
    } catch (error) {
        console.error('Error listing tables:', error);
    } finally {
        await pool.end();
    }
}

listTables();
