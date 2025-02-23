import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";

import { getUser } from "@/lib/kinde";

const tags = ["Weather"];

export const get = createRoute({
  path: "/weather",
  method: "get",
  middleware: [getUser],
  request: {
    query: z.object({
      lat: z.string()
        .min(1, "Latitude is required")
        // Adds validation for the latitude parameter (-90 to 90 degrees)
        .regex(/^-?([0-8]?\d|90)(\.\d+)?$/, "Invalid latitude format")
        .describe("Latitude"),
      lon: z.string()
        .min(1, "Longitude is required")
        // Adds validation for the longitude parameter (-180 to 180 degrees)
        .regex(/^-?(\d{1,2}|1[0-7]\d|180)(\.\d+)?$/, "Invalid longitude format")
        .describe("Longitude"),
      units: z.string()
        .optional()
        .describe("Units to return the weather in"),
      lang: z.string()
        .optional()
        .describe("Language to return the weather in"),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      "Weather information",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Failed to get weather information",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({
        lat: z.string(),
        lon: z.string(),
      })),
      "Invalid latitude or longitude parameters",
    ),
  },
});

export const geocode = createRoute({
  path: "/weather/geocode",
  method: "get",
  middleware: [getUser],
  request: {
    query: z.object({
      q: z.string()
        .min(1, "Search query is required")
        .describe("City name, state code (optional), and country code divided by comma. Please use ISO 3166 country codes."),
      limit: z.string()
        .optional()
        .describe("Number of locations to return"),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({
          name: z.string(),
          local_names: z.record(z.string()).optional(),
          lat: z.number(),
          lon: z.number(),
          country: z.string(),
          state: z.string(),
        }),
      ),
      "Geographic coordinates for the location",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Failed to get location coordinates",
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
export type GeocodeRoute = typeof geocode;
