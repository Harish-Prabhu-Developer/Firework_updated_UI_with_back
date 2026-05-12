import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: [
    './src/db/schema/users.ts',
    './src/db/schema/category.ts',
    './src/db/schema/invoices.ts',
    './src/db/schema/settings.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
