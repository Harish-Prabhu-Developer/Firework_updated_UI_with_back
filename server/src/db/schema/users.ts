
// server/src/db/schema/users.ts

import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/* =========================
   ROLES
========================= */
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   USERS
========================= */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 150 }),

  email: varchar("email", { length: 150 }).unique(),

  phone: varchar("phone", { length: 20 }).unique(),

  password: varchar("password", { length: 255 }),

  roleId: uuid("role_id").references(() => roles.id),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   MODULES (UI LEFT MENU)
========================= */
export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   PERMISSION ACTIONS (HEADER)
========================= */
export const permissionActions = pgTable('permission_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: varchar('action', { length: 50 }).notNull().unique(), // 'read', 'write', etc.
  name: varchar('name', { length: 50 }).notNull(), // 'Read', 'Write', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
/* =========================
   ROLE PERMISSIONS (MATRIX)
========================= */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),

    actionId: uuid("action_id")
      .notNull()
      .references(() => permissionActions.id, { onDelete: "cascade" }),

    isAllowed: boolean("is_allowed").default(false),
    allowAll: boolean("allow_all").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    roleModuleActionUnique: unique().on(
      table.roleId,
      table.moduleId,
      table.actionId
    ),
  })
);


/* =========================
   USER SESSIONS (REFRESH TOKENS)
========================= */
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshToken: varchar("refresh_token", { length: 500 }).notNull().unique(),
  fcmToken: varchar("fcm_token", { length: 500 }),
  fcmPlatform: varchar("fcm_platform", { length: 50 }),
  deviceInfo: varchar("device_info", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   RELATIONS
========================= */

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sessions: many(userSessions),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  permissions: many(rolePermissions),
}));

export const permissionActionsRelations = relations(permissionActions, ({ many }) => ({
  permissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  module: one(modules, {
    fields: [rolePermissions.moduleId],
    references: [modules.id],
  }),
  action: one(permissionActions, {
    fields: [rolePermissions.actionId],
    references: [permissionActions.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

