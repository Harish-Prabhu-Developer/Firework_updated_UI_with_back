// src/db/seed/truncate-tables.ts
import { db } from '../index.js';
import { sql } from 'drizzle-orm';
import "dotenv/config";

async function truncateTables() {
    console.log('🧹 Truncating all tables...');

    try {
        // Disable foreign key checks temporarily
        await db.execute(sql`SET session_replication_role = 'replica';`);

        // Truncate tables in reverse order (respecting foreign keys)
        const tables = [
            'user_sessions',
            'role_permissions',
            'permission_actions',
            'modules',
            'users',
            'roles'
        ];

        for (const table of tables) {
            console.log(`Truncating table: ${table}`);
            await db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE;`);
        }

        // Reset sequences (for PostgreSQL)
        for (const table of tables) {
            try {
                await db.execute(sql`
                    SELECT setval(pg_get_serial_sequence('${sql.raw(table)}', 'id'), 1, false);
                `);
            } catch (error) {
                // Ignore if no sequence exists
            }
        }

        // Re-enable foreign key checks
        await db.execute(sql`SET session_replication_role = 'origin';`);

        console.log('✅ All tables truncated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to truncate tables:', error);
        process.exit(1);
    }
}

truncateTables();