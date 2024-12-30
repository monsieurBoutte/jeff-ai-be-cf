import { eq } from "drizzle-orm";
import OpenAI from "openai";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { feedback } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./feedback.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const feedback = await db.query.feedback.findMany();
  return c.json(feedback, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const feedbackPayload = c.req.valid("json");

  const openai = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  // fake the embedding in TEST environment
  const fakeEmbedding = Array.from({ length: 1536 }, () => Math.floor(Math.random() * 100));
  const embedding = c.env.NODE_ENV !== "test" && feedbackPayload.comment
    ? await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: feedbackPayload.comment,
      encoding_format: "float",
    })
    : {
        object: "list",
        data: [
          {
            object: "embedding",
            index: 0,
            embedding: fakeEmbedding,
          },
        ],
      };

  const [inserted] = await db.insert(feedback).values({ ...feedbackPayload, vector: feedbackPayload.comment ? embedding.data[0].embedding : undefined }).returning();
  return c.json(inserted, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");

  const feedbackRecord = await db.query.feedback.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!feedbackRecord) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(feedbackRecord, HttpStatusCodes.OK);
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

  const [updatedRecord] = await db.update(feedback)
    .set(updates)
    .where(eq(feedback.id, id))
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
  const result = await db.delete(feedback)
    .where(eq(feedback.id, id));

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
