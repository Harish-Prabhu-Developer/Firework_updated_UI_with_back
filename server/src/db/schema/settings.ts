import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopName: varchar("shop_name", { length: 255 }).notNull().default("PRABHU CRACKERS"),
  shopPhone: varchar("shop_phone", { length: 20 }).notNull().default("9944336113"),
  shopAddress: varchar("shop_address", { length: 500 }).notNull().default("Main Road, Sivakasi, Tamil Nadu"),
  shopGst: varchar("shop_gst", { length: 50 }).default("xxxxxxxxxxx"),
  shopEmail: varchar("shop_email", { length: 255 }).default("crackerskingdom26@gmail.com"),
  minimumOrder: integer("minimum_order").notNull().default(3000),
  whatsappNum: varchar("whatsapp_num", { length: 20 }).notNull().default("919944336113"),
  socialMedias: jsonb("social_medias").notNull().default({
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/"
  }),
  salesStatus: boolean("sales_status").notNull().default(true),
  orderReceiptQrStatus: boolean("order_receipt_qr_status").notNull().default(true),
  invoiceQrStatus: boolean("invoice_qr_status").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
