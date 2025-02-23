import { createRouter } from "@/lib/create-app";

import * as handlers from "./weather.handlers";
import * as routes from "./weather.routes";

const router = createRouter()
  .openapi(routes.get, handlers.get)
  .openapi(routes.geocode, handlers.geocode);

export default router;
