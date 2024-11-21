import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { UserType } from "@kinde-oss/kinde-typescript-sdk";
import type { PinoLogger } from "hono-pino";

import type { Environment } from "@/env";

export interface AppBindings {
  Bindings: Environment;
  Variables: {
    logger: PinoLogger;
    user?: UserType;
  };
};

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
