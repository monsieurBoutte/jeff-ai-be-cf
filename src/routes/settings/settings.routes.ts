import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import { insertSettingsSchema, patchSettingsSchema, selectSettingsSchema } from "@/db/schema";
import { getUser } from "@/lib/kinde";

const tags = ["Settings"];

export const get = createRoute({
  path: "/settings",
  method: "get",
  middleware: [getUser],
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectSettingsSchema,
      "The user settings",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Settings not found",
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
  path: "/settings",
  method: "post",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      insertSettingsSchema,
      "The settings to create",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectSettingsSchema,
      "The created settings",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertSettingsSchema),
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

export const patch = createRoute({
  path: "/settings",
  method: "patch",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      patchSettingsSchema,
      "The settings updates",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectSettingsSchema,
      "The updated settings",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Settings not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchSettingsSchema),
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

export type GetRoute = typeof get;
export type CreateRoute = typeof create;
export type PatchRoute = typeof patch;
