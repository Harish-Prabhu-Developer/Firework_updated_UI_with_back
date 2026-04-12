import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./category.js";
import { users } from "./users.js";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "upi", "card"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "converted", "cancelled"]);

/* =========================
   CUSTOMERS
========================= */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(), // Unique identifier
    email: varchar("email", { length: 150 }), // Optional
    address: text("address"), // Optional
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: index("customer_phone_idx").on(table.phone),
  })
);

/* =========================
   INVOICES
========================= */
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    
    // Links
    userId: uuid("user_id").references(() => users.id), // Created by
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }), // Billing for this customer
    
    // Totals
    subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    
    // Status
    paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
    
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceNoIdx: index("invoice_number_idx").on(table.invoiceNumber),
    customerIdx: index("invoice_customer_id_idx").on(table.customerId),
  })
);

/* =========================
   INVOICE ITEMS
========================= */
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  productId: uuid("product_id"), // Decoupled from products table at DB level
  
  productName: varchar("product_name", { length: 255 }), // Historical snapshot
  productContent: text("product_content"), // Historical snapshot
  productImage: text("product_image"), // Historical snapshot
  
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

/* =========================
   ORDERS
========================= */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // ORD-260228-001
    
    // Links
    userId: uuid("user_id").references(() => users.id), // Created by
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    
    // Totals
    subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    
    // Status
    status: orderStatusEnum("status").default("pending").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
    
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderNoIdx: index("order_number_idx").on(table.orderNumber),
    customerIdx: index("order_customer_id_idx").on(table.customerId),
  })
);

/* =========================
   ORDER ITEMS
========================= */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id"), // Decoupled from products table at DB level
  
  productName: varchar("product_name", { length: 255 }), // Historical snapshot
  productContent: text("product_content"), // Historical snapshot
  productImage: text("product_image"), // Historical snapshot
  
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

/* =========================
   RELATIONS
========================= */

// Customer Relations
export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
  orders: many(orders),
}));

// Invoice Relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
}));

// Invoice Item Relations
export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Order Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

// Order Item Relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
