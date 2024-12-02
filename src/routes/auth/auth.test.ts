import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";

import env from "@/env-runtime";
import createApp from "@/lib/create-app";

import router from "./auth.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("auth routes", () => {
  it("get /me returns the current user", async () => {
    // @ts-expect-error - expected lint error
    const response = await client.me.$get();
    expect(response.status).toBe(200);

    if (response.status === 200) {
      const json = await response.json();
      expect(json.user).toEqual({
        id: "foo",
        given_name: "Test",
        family_name: "User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
      });
    }
  });

  it("get /me returns unauthorized when no token is provided", async () => {
    // Override the mock for this specific test
    vi.mocked(await import("@/lib/kinde")).getUser.mockImplementationOnce(
      async (c) => {
        c.status(401);
        return c.json({ error: "Unauthorized" });
      },
    );

    // @ts-expect-error - expected lint error
    const response = await client.me.$get();
    expect(response.status).toBe(401);

    if (response.status === 401) {
      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    }
  });
});
