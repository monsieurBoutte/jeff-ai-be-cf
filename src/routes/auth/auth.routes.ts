import type { UserType } from "@kinde-oss/kinde-typescript-sdk";

import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";

import { insertUsersSchema, selectUsersSchema } from "@/db/schema";
import { getUser } from "@/lib/kinde";

const tags = ["Auth"];

export const login = createRoute({
  method: "get",
  path: "/login",
  tags,
  responses: {
    302: {
      description: "Redirect to Kinde login page",
      headers: {
        Location: {
          description: "URL to redirect to",
          schema: { type: "string" },
        },
      },
    },
  },
});

export const register = createRoute({
  method: "get",
  path: "/register",
  tags,
  responses: {
    302: {
      description: "Redirect to Kinde registration page",
      headers: {
        Location: {
          description: "URL to redirect to",
          schema: { type: "string" },
        },
      },
    },
  },
});

export const callback = createRoute({
  method: "get",
  path: "/callback",
  tags,
  responses: {
    302: {
      description: "Redirect to application after successful authentication",
      headers: {
        Location: {
          description: "URL to redirect to",
          schema: { type: "string" },
        },
      },
    },
  },
});

export const logout = createRoute({
  method: "get",
  path: "/logout",
  tags,
  responses: {
    302: {
      description: "Redirect to Kinde logout page",
      headers: {
        Location: {
          description: "URL to redirect to",
          schema: { type: "string" },
        },
      },
    },
  },
});

export const me = createRoute({
  method: "get",
  path: "/me",
  middleware: [getUser],
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        user: z.custom<UserType>(),
      }),
      "Current user profile",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized error response",
    ),
  },
});

export const capture = createRoute({
  path: "/capture",
  method: "post",
  middleware: [getUser],
  request: {
    body: jsonContentRequired(
      insertUsersSchema,
      "User to capture",
    ),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: selectUsersSchema,
      }),
      "User already exists",
    ),
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        user: selectUsersSchema,
      }),
      "User created successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        error: z.string(),
      }),
      "Unauthorized error response",
    ),
  },
});

export type LoginRoute = typeof login;
export type RegisterRoute = typeof register;
export type CallbackRoute = typeof callback;
export type LogoutRoute = typeof logout;
export type MeRoute = typeof me;
export type CaptureRoute = typeof capture;
