import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { refinements } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./refinements.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const refinements = await db.query.refinements.findMany();
  return c.json(refinements, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const refinementsPayload = c.req.valid("json");

  // todo add openai embedding for non-test environments
  // fake the embedding in TEST environment
  const fakeEmbedding = Array.from({ length: 1536 }, () => Math.floor(Math.random() * 100));
  const placeholderVector = c.env.NODE_ENV === "test" ? fakeEmbedding : undefined;

  const [inserted] = await db.insert(refinements).values({ ...refinementsPayload, vector: placeholderVector }).returning();
  return c.json(inserted, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");

  const refinementRecord = await db.query.refinements.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!refinementRecord) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(refinementRecord, HttpStatusCodes.OK);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");
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

  const [updatedRecord] = await db.update(refinements)
    .set(updates)
    .where(eq(refinements.id, id))
    .returning();

  if (!updatedRecord) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(updatedRecord, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");
  const result = await db.delete(refinements)
    .where(eq(refinements.id, id));

  if (result.rowsAffected === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
