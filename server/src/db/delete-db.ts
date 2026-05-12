import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function deleteDatabase() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not set in .env');
        process.exit(1);
    }

    // Parse the URL to get the DB name and connection info for the default 'postgres' database
    const url = new URL(dbUrl);
    const dbName = url.pathname.slice(1); // Remove the leading slash

    // Replace the database name with 'postgres' to connect to the default DB
    url.pathname = '/postgres';
    const defaultDbUrl = url.toString();

    const client = new Client({
        connectionString: defaultDbUrl,
    });

    try {
        await client.connect();
        console.log(`Connected to default database. Checking if database '${dbName}' exists...`);

        const res = await client.query(
            `SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`,
            [dbName]
        );

        if (res.rowCount !== null && res.rowCount > 0) {
            console.log(`Database '${dbName}' exists. Attempting to drop...`);
            
            // Terminate active connections to the target database to allow dropping
            console.log(`Closing active connections to '${dbName}'...`);
            await client.query(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = $1
                AND pid <> pg_backend_pid();
            `, [dbName]);

            // Drop the database
            await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
            console.log(`✅ Database '${dbName}' deleted successfully.`);
        } else {
            console.log(`ℹ️ Database '${dbName}' does not exist. Nothing to delete.`);
        }
    } catch (error) {
        console.error('❌ Error deleting database:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deleteDatabase();
