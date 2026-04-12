
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function fixTable() {
    try {
        console.log('Attempting to create settings table manually...');
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "settings" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "shop_name" varchar(255) NOT NULL DEFAULT 'PRABHU CRACKERS',
                "shop_phone" varchar(20) NOT NULL DEFAULT '9944336113',
                "shop_address" varchar(500) NOT NULL DEFAULT 'Main Road, Sivakasi, Tamil Nadu',
                "shop_gst" varchar(50) DEFAULT '',
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log('✅ Settings table created/verified successfully!');
        
        // Seed if empty
        const count = await db.execute(sql`SELECT count(*) FROM "settings"`);
        if (count[0].count === '0') {
            await db.execute(sql`
                INSERT INTO "settings" (shop_name, shop_phone, shop_address, shop_gst)
                VALUES ('PRABHU CRACKERS', '9944336113', 'Main Road, Sivakasi, Tamil Nadu', '');
            `);
            console.log('✅ Default settings seeded!');
        }
        
    } catch (error) {
        console.error('❌ Failed to create table:', error);
    } finally {
        process.exit(0);
    }
}

fixTable();
