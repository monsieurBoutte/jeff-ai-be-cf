import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import { insertRefinementsSchema, patchRefinementsSchema, selectRefinementsSchema } from "@/db/schema";
import { notFoundSchema } from "@/lib/constants";
import { getUser } from "@/lib/kinde";

const tags = ["Refinements"];

export const list = createRoute({
  path: "/refinements",
  method: "get",
  middleware: [getUser],
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectRefinementsSchema),
      "The list of refinements",
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
  path: "/refinements",
  method: "post",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      insertRefinementsSchema.extend({
        additionalContext: z.string().optional(),
      }).omit({
        originalTextWordCount: true,
        refinedText: true,
        refinedTextWordCount: true,
        vector: true,
      }),
      "The feedback to create",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectRefinementsSchema.extend({
        explanation: z.string().optional(),
      }),
      "The created refinement",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertRefinementsSchema),
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

export const convertToMarkdown = createRoute({
  path: "/refinements/convert-to-markdown",
  method: "post",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      z.object({
        html: z.string(),
      }),
      "The HTML to convert to markdown",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        markdown: z.string(),
      }),
      "The markdown",
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
  path: "/refinements/{id}",
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
      selectRefinementsSchema,
      "The requested refinement",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Refinement not found",
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
  path: "/refinements/{id}",
  method: "patch",
  middleware: [getUser],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: jsonContentRequired(
      patchRefinementsSchema,
      "The refinement updates",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectRefinementsSchema,
      "The updated refinement",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Refinement not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(patchRefinementsSchema)
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
  path: "/refinements/{id}",
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
      description: "Refinement deleted",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Refinement not found",
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
export type ConvertToMarkdownRoute = typeof convertToMarkdown;
export type GetOneRoute = typeof getOne;
export type PatchRoute = typeof patch;
export type RemoveRoute = typeof remove;
