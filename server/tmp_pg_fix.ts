
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Connected to Database.');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "settings" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "shop_name" varchar(255) NOT NULL DEFAULT 'PRABHU CRACKERS',
                "shop_phone" varchar(20) NOT NULL DEFAULT '9944336113',
                "shop_address" varchar(500) NOT NULL DEFAULT 'Main Road, Sivakasi, Tamil Nadu',
                "shop_gst" varchar(50) DEFAULT '',
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log('✅ Settings table created/verified.');
        
        const res = await client.query('SELECT count(*) FROM "settings"');
        if (res.rows[0].count === '0') {
            await client.query(`
                INSERT INTO "settings" (shop_name, shop_phone, shop_address, shop_gst)
                VALUES ('PRABHU CRACKERS', '9944336113', 'Main Road, Sivakasi, Tamil Nadu', '');
            `);
            console.log('✅ Default settings seeded.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

run();
