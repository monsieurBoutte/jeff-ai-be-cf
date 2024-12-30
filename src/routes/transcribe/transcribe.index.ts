import { createRouter } from "@/lib/create-app";

import * as handlers from "./transcribe.handlers";
import * as routes from "./transcribe.routes";

const router = createRouter()
  .openapi(routes.create, handlers.create);

export default router;
