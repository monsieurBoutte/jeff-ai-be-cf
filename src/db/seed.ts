import { drizzle } from "drizzle-orm/libsql";
import { reset, seed } from "drizzle-seed";

import * as schema from "@/db/schema";
import env from "@/env-runtime";

async function main() {
  const db = drizzle(env.DATABASE_URL!);
  await reset(db, schema);
  await seed(db, schema, { count: 10, seed: 1 });
  // await seed(db, schema).refine(f => ({
  //   users: {
  //     count: 1,
  //     columns: {
  //       authUserId: f.fullName().init({ seed: 1 }),
  //     },
  //     with: {
  //       tasks: 10,
  //     },
  //   },
  // }));
}
main();
