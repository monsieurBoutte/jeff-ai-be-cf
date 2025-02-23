import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { settings } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetRoute, PatchRoute } from "./settings.routes";

export const get: AppRouteHandler<GetRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.authUserId, user.id),
  });

  if (!existingUser) {
    return c.json({ error: "User not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const userSettings = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, existingUser.id),
  });

  if (!userSettings) {
    return c.json(
      { error: "Settings not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(userSettings, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const settingsPayload = c.req.valid("json");

  const [inserted] = await db.insert(settings)
    .values(settingsPayload)
    .returning();

  return c.json(inserted, HttpStatusCodes.CREATED);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.authUserId, user.id),
  });

  if (!existingUser) {
    return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const [updatedRecord] = await db.update(settings)
    .set(updates)
    .where(eq(settings.userId, existingUser.id))
    .returning();

  if (!updatedRecord) {
    return c.json(
      { message: "Settings not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(updatedRecord, HttpStatusCodes.OK);
};
