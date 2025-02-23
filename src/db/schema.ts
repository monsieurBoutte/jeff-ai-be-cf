import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import { customType, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  assignedDate: integer("assigned_date", { mode: "timestamp" })
    .notNull(),
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

export const refinements = sqliteTable("refinements", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  originalText: text("original_text")
    .notNull(),
  originalTextWordCount: integer("original_text_word_count")
    .notNull(),
  refinedText: text("refined_text")
    .notNull(),
  refinedTextWordCount: integer("refined_text_word_count")
    .notNull(),
  explanation: text("explanation"),
  vector: float32Array("vector", { dimensions: 1536 })
    .default([]),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  lat: text("lat"),
  lon: text("lon"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  units: text("units").notNull().default("imperial"),
  language: text("language").notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  feedback: many(feedback),
  refinements: many(refinements),
  settings: one(settings, {
    fields: [users.id],
    references: [settings.userId],
  }),
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

export const refinementsRelations = relations(refinements, ({ one }) => ({
  user: one(users, {
    fields: [refinements.userId],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
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
    assignedDate: () => z.coerce.date().transform(val => new Date(val)),
  },
).required({
  done: true,
  assignedDate: true,
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

export const selectRefinementsSchema = createSelectSchema(refinements);

export const insertRefinementsSchema = createInsertSchema(refinements).required({
  userId: true,
  originalText: true,
  refinedText: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchRefinementsSchema = insertRefinementsSchema.partial();

export const selectSettingsSchema = createSelectSchema(settings);

export const insertSettingsSchema = createInsertSchema(
  settings,
  {
    lat: schema => schema.lat.min(1),
    lon: schema => schema.lon.min(1),
    city: schema => schema.city.min(1).max(100),
    state: schema => schema.state.min(1).max(100),
    country: schema => schema.country.min(2).max(2),
    units: schema => schema.units.refine(val => ["standard", "metric", "imperial"].includes(val), {
      message: "Units must be either 'standard', 'metric', or 'imperial'",
    }),
    language: schema => schema.language.min(2).max(2),
  },
).required({
  userId: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchSettingsSchema = insertSettingsSchema.partial();
