import {
  pgTable,
  uuid,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopName: varchar("shop_name", { length: 255 }).notNull().default("PRABHU CRACKERS"),
  shopPhone: varchar("shop_phone", { length: 20 }).notNull().default("9944336113"),
  shopAddress: varchar("shop_address", { length: 500 }).notNull().default("Main Road, Sivakasi, Tamil Nadu"),
  shopGst: varchar("shop_gst", { length: 50 }).default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
