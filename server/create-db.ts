import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'root',
  database: 'postgres', // Connect to default DB to create new one
};

const createDb = async () => {
  const client = new pg.Client(config);
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    const dbName = 'crackers_kingdom_shop';
    
    // Check if DB exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
};

createDb();
