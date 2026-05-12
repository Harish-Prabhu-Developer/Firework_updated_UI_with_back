import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function createDatabase() {
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

        if (res.rowCount === 0) {
            console.log(`Database '${dbName}' does not exist. Creating...`);
            // Cannot use parameterized queries for CREATE DATABASE
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database '${dbName}' created successfully.`);
        } else {
            console.log(`✅ Database '${dbName}' already exists.`);
        }
    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createDatabase();
