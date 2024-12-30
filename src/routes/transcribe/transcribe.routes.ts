import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

import { getUser } from "@/lib/kinde";

const tags = ["Transcribe"];

export const create = createRoute({
  path: "/transcribe",
  method: "post",
  middleware: [getUser],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.instanceof(File),
            language: z.string().optional(),
            refine: z.string().optional(),
          }),
        },
      },
    },
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        transcription: z.string(),
        refined: z.string().optional(),
        explanation: z.string().optional(),
      }),
      "The transcription of the media file",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "No valid file provided",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Failed to transcribe file or get transcription",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
  },
});

export type CreateRoute = typeof create;
