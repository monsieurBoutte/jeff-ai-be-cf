import { execSync } from "node:child_process";
import fs from "node:fs";
import { afterAll, beforeAll, vi } from "vitest";

beforeAll(async () => {
  // Remove any existing test database
  fs.rmSync("test.db", { force: true });

  // Set up fresh database with force flag to drop existing tables
  execSync("pnpm drizzle-kit push");
  execSync("pnpm db:seed");

  vi.mock("@/lib/kinde", async () => {
    const actual = await vi.importActual("@/lib/kinde");
    return {
      ...actual,
      getUser: vi.fn().mockImplementation(async (c, next) => {
        // Mock setting the user in the context
        c.set("user", {
          id: "foo",
          given_name: "Test",
          family_name: "User",
          email: "test@example.com",
          picture: "https://example.com/avatar.jpg",
        });
        // Call next to continue the middleware chain
        await next();
      }),
    };
  });
});

afterAll(async () => {
  // Clean up after all tests
  fs.rmSync("test.db", { force: true });
});
