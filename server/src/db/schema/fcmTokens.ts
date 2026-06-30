// server/src/db/schema/fcmTokens.ts
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const devicePlatformEnum = pgEnum("device_platform", ["android", "ios", "web"]);

export const fcmTokens = pgTable(
    "fcm_tokens",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        fcmToken: varchar("fcm_token", { length: 500 }).notNull().unique(),
        platform: devicePlatformEnum("platform").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
    },
    (table) => ({
        userIdx: index("fcm_tokens_user_id_idx").on(table.userId),
    })
);

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
    user: one(users, { fields: [fcmTokens.userId], references: [users.id] }),
}));