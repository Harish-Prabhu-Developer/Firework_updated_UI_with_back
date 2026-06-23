// server/src/db/schema/category.ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* =========================
   CATEGORIES
========================= */

export const categories = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull().unique(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    description: text("description"),
    image: text("image"),
    categoryDiscount: numeric("category_discount", { precision: 5, scale: 2 }).default("0"),
    rank: integer("display_order").default(0).notNull(),
    isActive: boolean("status").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    slugIdx: index("category_slug_idx").on(table.slug),
    rankIdx: index("category_display_order_idx").on(table.rank),
  })
);

/* =========================
   PRODUCTS
========================= */

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict", onUpdate: "cascade" }),

    productCode: varchar("product_code", { length: 50 }).notNull().unique(),

    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    image: text("image"),
    images: text("images"),

    stock: integer("stock").default(0).notNull(),
    tag: varchar("tag", { length: 80 }),
    unit: varchar("unit", { length: 20 }),

    rank: integer("display_order").default(0).notNull(),
    mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull(),
    productDiscount: numeric("product_discount", { precision: 5, scale: 2 }).default("0"),
    isActive: boolean("status").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    categorySlugUnique: unique().on(table.categoryId, table.slug),
    categoryIdx: index("products_category_id_idx").on(table.categoryId),
    rankIdx: index("products_display_order_idx").on(table.rank),
    statusIdx: index("products_status_idx").on(table.isActive),
  })
);

/* =========================
   VIDEOS
========================= */

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 150 }),
    type: varchar("type", { length: 20 }).default("upload").notNull(),
    url: text("url").notNull(),
    isActive: boolean("status").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    productIdx: index("videos_product_id_idx").on(table.productId),
  })
);

/* =========================
   RELATIONS
========================= */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  product: one(products, {
    fields: [videos.productId],
    references: [products.id],
  }),
}));
