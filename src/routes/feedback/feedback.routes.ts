import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import { insertFeedbackSchema, patchFeedbackSchema, selectFeedbackSchema } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";
import { getUser } from "@/lib/kinde";

const tags = ["Feedback"];

export const list = createRoute({
  path: "/feedback",
  method: "get",
  middleware: [getUser],
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectFeedbackSchema),
      "The list of feedback",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export const create = createRoute({
  path: "/feedback",
  method: "post",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      insertFeedbackSchema.omit({ vector: true }),
      "The feedback to create",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectFeedbackSchema,
      "The created feedback",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertFeedbackSchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export const getOne = createRoute({
  path: "/feedback/{id}",
  method: "get",
  middleware: [getUser],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectFeedbackSchema,
      "The requested feedback",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Feedback not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({ id: z.string() })),
      "Invalid id error",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export const patch = createRoute({
  path: "/feedback/{id}",
  method: "patch",
  middleware: [getUser],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: jsonContentRequired(
      patchFeedbackSchema,
      "The feedback updates",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectFeedbackSchema,
      "The updated feedback",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Feedback not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchFeedbackSchema)
        .or(createErrorSchema(z.object({ id: z.string() }))),
      "The validation error(s)",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export const remove = createRoute({
  path: "/feedback/{id}",
  method: "delete",
  middleware: [getUser],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Feedback deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Feedback not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({ id: z.string() })),
      "Invalid id error",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
