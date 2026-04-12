// src/db/seed/drop-tables.ts
import { db } from '../index.js';
import { sql } from 'drizzle-orm';
import "dotenv/config";

async function dropTables() {
    console.log('🗑️  Dropping all tables...');

    try {
        // Disable foreign key checks temporarily
        await db.execute(sql`SET session_replication_role = 'replica';`);

        // Drop tables in reverse order (respecting foreign keys)
        const tables = [
            'user_sessions',
            'role_permissions',
            'permission_actions',
            'modules',
            'users',
            'roles'
        ];

        for (const table of tables) {
            console.log(`Dropping table: ${table}`);
            await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE;`);
        }

        // Re-enable foreign key checks
        await db.execute(sql`SET session_replication_role = 'origin';`);

        console.log('✅ All tables dropped successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to drop tables:', error);
        process.exit(1);
    }
}

dropTables();