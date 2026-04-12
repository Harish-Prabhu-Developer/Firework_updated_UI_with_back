import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function sync() {
  try {
    console.log('Adding color column to tags table...');
    await db.execute(sql`ALTER TABLE tags ADD COLUMN IF NOT EXISTS color varchar(7);`);
    
    console.log('Creating product_tags table if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "product_tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "product_tags_product_id_tag_id_unique" UNIQUE("product_id", "tag_id")
      );
    `);
    
    console.log('Adding foreign keys to product_tags...');
    try {
      await db.execute(sql`
        ALTER TABLE "product_tags" 
        ADD CONSTRAINT "product_tags_product_id_products_id_fk" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE cascade;
      `);
    } catch (e) {}
    
    try {
      await db.execute(sql`
        ALTER TABLE "product_tags" 
        ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" 
        FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE cascade;
      `);
    } catch (e) {}

    console.log('✅ Manual sync completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during manual sync:', err);
    process.exit(1);
  }
}

sync();
