import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* =========================
   BANNERS (HERO CAROUSEL)
========================= */

export const banners = pgTable(
  "hero_slides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    image: text("image").notNull(),
    badgeIcon: varchar("badge_icon", { length: 50 }).notNull(),
    badge: varchar("badge", { length: 120 }).notNull(),
    title: varchar("title", { length: 60 }).notNull(), // Supports multiline with '\n'
    desc: text("description").notNull(),
    cta: varchar("cta", { length: 30 }).notNull().default("Get My Estimate"),
    link: varchar("link", { length: 200 }).notNull().default("/products"),
    displayOrder: integer("display_order").default(1).notNull(),
    status: boolean("status").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("hero_slides_display_order_idx").on(table.displayOrder),
  })
);

/* =========================
   UOM (UNIT OF MEASURE)
========================= */

export const uoms = pgTable(
  "uoms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    description: text("description"),
    isActive: boolean("status").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeUnique: unique().on(table.code),
    nameUnique: unique().on(table.name),
  })
);

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
    rank: integer("display_order").default(0).notNull(),
    isActive: boolean("status").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

    uomId: uuid("uom_id")
      .notNull()
      .references(() => uoms.id, { onDelete: "restrict", onUpdate: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    image: text("image"),
    images: text("images"),

    rank: integer("display_order").default(0).notNull(),
    mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
    conversionQty: integer("conversion_qty").default(1).notNull(),
    isActive: boolean("status").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categorySlugUnique: unique().on(table.categoryId, table.slug),
    categoryIdx: index("products_category_id_idx").on(table.categoryId),
    rankIdx: index("products_display_order_idx").on(table.rank),
    statusIdx: index("products_status_idx").on(table.isActive),
  })
);

/* =========================
   PRODUCT STOCK
========================= */

export const productStocks = pgTable(
  "product_stocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    quantity: integer("quantity").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    oneStockPerProduct: unique().on(table.productId),
    productIdx: index("product_stocks_product_id_idx").on(table.productId),
  })
);

/* =========================
   TAGS + PRODUCT TAGS
========================= */

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    color: varchar("color", { length: 7 }),

    rank: integer("display_order").default(0).notNull(),
    showLimit: integer("show_limit").default(0).notNull(),

    isActive: boolean("status").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameUnique: unique().on(table.name),
    slugIdx: index("tags_slug_idx").on(table.slug),
    rankIdx: index("tags_display_order_idx").on(table.rank),
  })
);

export const productTags = pgTable(
  "product_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productTagUnique: unique().on(table.productId, table.tagId),
    productIdx: index("product_tags_product_id_idx").on(table.productId),
    tagIdx: index("product_tags_tag_id_idx").on(table.tagId),
  })
);

/* =========================
   VIDEOS
========================= */

export const videoTypeEnum = pgEnum("video_type", ["upload", "youtube"]);

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: varchar("name", { length: 150 }),
    type: videoTypeEnum("type").default("upload").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const uomsRelations = relations(uoms, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  uom: one(uoms, {
    fields: [products.uomId],
    references: [uoms.id],
  }),
  stock: one(productStocks, {
    fields: [products.id],
    references: [productStocks.productId],
  }),
  videos: many(videos),
  productTags: many(productTags),
}));

export const productStocksRelations = relations(productStocks, ({ one }) => ({
  product: one(products, {
    fields: [productStocks.productId],
    references: [products.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  product: one(products, {
    fields: [videos.productId],
    references: [products.id],
  }),
}));
