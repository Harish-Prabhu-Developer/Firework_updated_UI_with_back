// server/src/db/schema/invoices.ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./category.js";
import { users } from "./users.js";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "upi", "card"]);
export const orderStatusEnum = pgEnum("order_status", [
  "ESTIMATE_SUBMITTED",
  "PENDING_VERIFICATION",
  "REJECTED",
  "CONFIRMED",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "converted"
]);
export const gstTypeEnum = pgEnum("gst_type", ["INSIDE_TN", "OUTSIDE_TN"]);

/* =========================
   CUSTOMERS
========================= */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 150 }).unique(),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    phoneIdx: index("customer_phone_idx").on(table.phone),
    emailIdx: index("customer_email_idx").on(table.email),
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
    userId: uuid("user_id").references(() => users.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),

    // Totals
    subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),

    // GST Breakdown
    gstEnabled: boolean("gst_enabled").default(false).notNull(),
    gstType: gstTypeEnum("gst_type").default("INSIDE_TN"),
    gstPercentage: real("gst_percentage").default(0),
    taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }).default("0"),

    // CGST / SGST (Inside TN)
    cgstPercentage: real("cgst_percentage").default(0),
    cgstAmount: numeric("cgst_amount", { precision: 12, scale: 2 }).default("0"),
    sgstPercentage: real("sgst_percentage").default(0),
    sgstAmount: numeric("sgst_amount", { precision: 12, scale: 2 }).default("0"),

    // IGST (Outside TN)
    igstPercentage: real("igst_percentage").default(0),
    igstAmount: numeric("igst_amount", { precision: 12, scale: 2 }).default("0"),

    // Status & Meta
    paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    invoiceNoIdx: index("invoice_number_idx").on(table.invoiceNumber),
    customerIdx: index("invoice_customer_id_idx").on(table.customerId),
    createdAtIdx: index("invoice_created_at_idx").on(table.createdAt),
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
  productId: uuid("product_id"), // Soft-link, not FK (historical snapshot)

  productName: varchar("product_name", { length: 255 }),
  productContent: text("product_content"),
  productImage: text("product_image"),

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
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),

    // Links
    userId: uuid("user_id").references(() => users.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),

    // Totals
    subTotal: numeric("sub_total", { precision: 12, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),

    // Status
    status: orderStatusEnum("status").default("ESTIMATE_SUBMITTED").notNull(),

    // Workflow Tracking
    rejectionReason: text("rejection_reason"),
    transportName: text("transport_name"),
    lrNumber: text("lr_number"),
    vehicleNumber: text("vehicle_number"),
    confirmedAt: timestamp("confirmed_at"),
    dispatchedAt: timestamp("dispatched_at"),
    deliveredAt: timestamp("delivered_at"),
    paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
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
  productId: uuid("product_id"),

  productName: varchar("product_name", { length: 255 }),
  productContent: text("product_content"),
  productImage: text("product_image"),

  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
});

/* =========================
   ORDER STATUS LOGS
========================= */
export const orderStatusLogs = pgTable("order_status_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  remarks: text("remarks"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   RELATIONS
========================= */

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
  orders: many(orders),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  product: one(products, { fields: [invoiceItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  statusLogs: many(orderStatusLogs),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  order: one(orders, { fields: [orderStatusLogs.orderId], references: [orders.id] }),
  user: one(users, { fields: [orderStatusLogs.createdBy], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
