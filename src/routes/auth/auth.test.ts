import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";

import env from "@/env-runtime";
import createApp from "@/lib/create-app";

import { mockExistingUser, mockUser } from "../../../test-mocks";
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
      expect(json.user).toEqual(mockUser);
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

  it("post /capture creates a new user when they don't exist in the database", async () => {
    // @ts-expect-error - expected lint error
    const response = await client.capture.$post();
    expect(response.status).toBe(202);

    const json = await response.json();

    // Validate the response structure and content
    expect(json).toMatchObject({
      message: "User created successfully",
      user: {
        authUserId: "foo",
        displayName: "Test User",
        email: "test@example.com",
        id: expect.any(String),
      },
    });
  });

  it("post /capture returns unauthorized when no user is authenticated", async () => {
    // Override the mock for this specific test
    vi.mocked(await import("@/lib/kinde")).getUser.mockImplementationOnce(
      async (c) => {
        c.status(401);
        return c.json({ error: "Unauthorized" });
      },
    );

    // @ts-expect-error - expected lint error
    const response = await client.capture.$post();
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json).toEqual({
      error: "Unauthorized",
    });
  });

  it("post /capture returns 200 when user already exists in the database", async () => {
    // Override the mock to simulate an existing user
    vi.mocked(await import("@/lib/kinde")).getUser.mockImplementationOnce(
      async (c, next) => {
        // Set the user in the context
        c.set("user", {
          id: mockExistingUser.auth_user_id,
          given_name: mockExistingUser.display_name,
          email: mockExistingUser.email,
          family_name: "",
          picture: "https://example.com/avatar.jpg",
        });

        // Continue the middleware chain
        await next();
      },
    );

    // @ts-expect-error - expected lint error
    const response = await client.capture.$post();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      message: "User already exists",
      user: {
        id: mockExistingUser.id,
        authUserId: mockExistingUser.auth_user_id,
        email: mockExistingUser.email,
        displayName: mockExistingUser.display_name,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});
