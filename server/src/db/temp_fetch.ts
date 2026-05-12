
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const { Pool } = pg;

async function fetchRecords() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const users = await pool.query('SELECT id, name, email, phone, password, is_active FROM users');
        console.log('--- USERS RECORDS ---');
        console.table(users.rows);

        const customers = await pool.query('SELECT id, name, email, phone, address FROM customers');
        console.log('\n--- CUSTOMERS RECORDS ---');
        console.table(customers.rows);
    } catch (error) {
        console.error('Error fetching records:', error);
    } finally {
        await pool.end();
    }
}

fetchRecords();
