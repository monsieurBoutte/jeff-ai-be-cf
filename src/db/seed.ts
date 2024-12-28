import { drizzle } from "drizzle-orm/libsql";
import { reset, seed } from "drizzle-seed";

import * as schema from "@/db/schema";
import env from "@/env-runtime";

async function main() {
  const db = drizzle(env.DATABASE_URL!);
  await reset(db, schema);
  await seed(db, schema).refine(f => ({
    users: {
      count: 3,
      columns: {
        id: f.valuesFromArray({
          values: ["foo", "bar", "baz"],
          isUnique: true,
        }),
      },
    },
    feedback: {
      count: 10,
      columns: {
        vector: f.valuesFromArray({
          values: [0, 0.3, 0.5, 0.7, 0.9],
          arraySize: 1536,
        }),
      },
    },
    refinements: {
      count: 10,
      columns: {
        vector: f.valuesFromArray({
          values: [0, 0.3, 0.5, 0.7, 0.9],
          arraySize: 1536,
        }),
      },
    },
  }));
}
main();
