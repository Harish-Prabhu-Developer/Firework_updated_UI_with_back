import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import * as categorySchema from '../db/schema/category.js';
import * as invoicesSchema from '../db/schema/invoices.js';
import * as usersSchema from '../db/schema/users.js';
import * as settingsSchema from '../db/schema/settings.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, {
  schema: {
    ...categorySchema,
    ...invoicesSchema,
    ...usersSchema,
    ...settingsSchema,
  },
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
