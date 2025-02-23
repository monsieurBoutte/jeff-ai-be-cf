import { createRouter } from "@/lib/create-app";

import * as handlers from "./settings.handlers";
import * as routes from "./settings.routes";

const router = createRouter()
  .openapi(routes.get, handlers.get)
  .openapi(routes.create, handlers.create)
  .openapi(routes.patch, handlers.patch);

export default router;
