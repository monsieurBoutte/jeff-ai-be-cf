import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import auth from "@/routes/auth/auth.index";
import feedback from "@/routes/feedback/feedback.index";
import index from "@/routes/index.route";
import refinements from "@/routes/refinements/refinements.index";
import tasks from "@/routes/tasks/tasks.index";
import transcribe from "@/routes/transcribe/transcribe.index";

const app = createApp();

configureOpenAPI(app);

const routes = [
  index,
  auth,
  feedback,
  refinements,
  tasks,
  transcribe,
] as const;

routes.forEach((route) => {
  app.route("/api/", route);
});

export type AppType = typeof routes[number];

export default app;
