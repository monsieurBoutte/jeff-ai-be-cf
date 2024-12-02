import { createRouter } from "@/lib/create-app";

import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const router = createRouter()
  .openapi(routes.login, handlers.login)
  .openapi(routes.register, handlers.register)
  .openapi(routes.callback, handlers.callback)
  .openapi(routes.logout, handlers.logout)
  .openapi(routes.me, handlers.me)
  .openapi(routes.capture, handlers.capture);

export default router;
