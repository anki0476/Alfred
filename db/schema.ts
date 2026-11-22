import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  version: integer("version").notNull().default(0),
  state: text("state").notNull(),
  updatedAt: text("updated_at").notNull(),
});


export const adaptiveLearners = sqliteTable("adaptive_learners", {
 userId: text("user_id").primaryKey().notNull(),
 version: integer("version").notNull().default(0),
 state: text("state").notNull(),
});
export const classrooms = sqliteTable("classrooms", {
 id: text("id").primaryKey().notNull(),
 ownerId: text("owner_id").notNull().unique(),
 name: text("name").notNull(),
 joinCode: text("join_code").notNull().unique(),
});
export const enrollments = sqliteTable("enrollments", {
 id: text("id").primaryKey().notNull(),
 classId: text("class_id").notNull(),
 userId: text("user_id").notNull(),
 alias: text("alias").notNull(),
});

export const notebookItems=sqliteTable("notebook_items",{id:text("id").primaryKey(),userId:text("user_id").notNull(),entry:text("entry").notNull()});

export const requestBudgets = sqliteTable("request_budgets", {
 id: text("id").primaryKey().notNull(),
 window: integer("window").notNull(),
 used: integer("used").notNull(),
 expiresAt: integer("expires_at").notNull(),
}, table => [index("request_budgets_expiry").on(table.expiresAt)]);
