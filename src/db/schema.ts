import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import { customType, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: import("buffer").Buffer;
}>({
      dataType(config) {
        return `F32_BLOB(${config.dimensions})`;
      },
      fromDriver(value: import("buffer").Buffer) {
        return Array.from(new Float32Array(value.buffer));
      },
      toDriver(value: number[]) {
        return sql`vector32(${JSON.stringify(value)})`;
      },
    });

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  authUserId: text("auth_user_id").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id", { mode: "number" })
    .primaryKey({ autoIncrement: true }),
  task: text("task")
    .notNull(),
  done: integer("done", { mode: "boolean" })
    .notNull()
    .default(false),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  featureType: text("feature_type")
    .notNull(),
  featureId: text("feature_id")
    .notNull(),
  rating: integer("rating")
    .notNull(),
  comment: text("comment"),
  vector: float32Array("vector", { dimensions: 1536 })
    .default([]),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  feedback: many(feedback),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const selectUsersSchema = createSelectSchema(users);

export const insertUsersSchema = createInsertSchema(
  users,
  {
    email: schema => schema.email.email().optional(),
    displayName: schema => schema.displayName.min(1).max(100).optional(),
  },
).required({
  authUserId: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchUsersSchema = insertUsersSchema.partial();

export const selectTasksSchema = createSelectSchema(tasks);

export const insertTasksSchema = createInsertSchema(
  tasks,
  {
    task: schema => schema.task.min(1).max(500),
  },
).required({
  done: true,
  userId: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchTasksSchema = insertTasksSchema.partial();

export const selectFeedbackSchema = createSelectSchema(feedback);

export const insertFeedbackSchema = createInsertSchema(
  feedback,
  {
    featureType: schema => schema.featureType.min(1).max(100),
    featureId: schema => schema.featureId.min(1),
    rating: schema => schema.rating.min(1).max(5),
    comment: schema => schema.comment.max(1000).optional(),
    vector: schema => schema.vector.array().optional(),
  },
).required({
  userId: true,
  featureType: true,
  featureId: true,
  rating: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchFeedbackSchema = insertFeedbackSchema.partial();
