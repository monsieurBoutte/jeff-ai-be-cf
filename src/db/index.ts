import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import type { Environment } from "@/env";

import * as schema from "./schema";

export async function createDb(env: Environment) {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client, {
    schema,
  });

  // Create feedback vector index
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS feedback_vector_index
    ON feedback(libsql_vector_idx(vector))
  `);

  return { db, client };
}
