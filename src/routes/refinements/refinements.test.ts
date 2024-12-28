import { testClient } from "hono/testing";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { describe, expect, expectTypeOf, it } from "vitest";
import { ZodIssueCode } from "zod";

import env from "@/env-runtime";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import createApp from "@/lib/create-app";

import router from "./refinements.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

const stableTestUserId = "foo";
const originalText = "This is the original text";
const refinedText = "This is a test refined copy";

const existingRefinementId = "xrAS2ApKK48UJSgXX";

describe("refinements routes", () => {
  it("post /refinements validates the body when creating", async () => {
    const response = await client.refinements.$post({
      // @ts-expect-error testing validation
      json: {
        userId: stableTestUserId,
        // originalText, <-- intentionally missing
      },
    });
    expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("originalText");
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.REQUIRED);
    }
  });

  it("post /refinements creates a refinement", async () => {
    const response = await client.refinements.$post({
      json: {
        userId: stableTestUserId,
        originalText,
      },
    });

    expect(response.status).toBe(HttpStatusCodes.CREATED);
    if (response.status === HttpStatusCodes.CREATED) {
      const json = await response.json();
      expect(json.id).toBeDefined();
      expect(json.userId).toBe(stableTestUserId);
      expect(json.originalText).toBe(originalText);
      expect(json.refinedText).toBe(refinedText);
    }
  });

  it("get /refinements lists all refinements", async () => {
    const response = await client.refinements.$get();
    expect(response.status).toBe(HttpStatusCodes.OK);
    if (response.status === HttpStatusCodes.OK) {
      const json = await response.json();
      expectTypeOf(json).toBeArray();
      // this is the number of refinements seeded in the src/db/seed.ts file
      // plus the one we created in the previous test
      expect(json.length).toBe(11);
    }
  });

  it("get /refinements/{id} returns 404 when refinement not found", async () => {
    const response = await client.refinements[":id"].$get({
      param: {
        id: "101",
      },
    });
    expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
    if (response.status === HttpStatusCodes.NOT_FOUND) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("get /refinements/{id} gets a single refinement", async () => {
    const response = await client.refinements[":id"].$get({
      param: {
        id: existingRefinementId,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.OK);
  });

  it("patch /refinements/{id} validates the body when updating", async () => {
    const response = await client.refinements[":id"].$patch({
      param: {
        id: existingRefinementId,
      },
      json: {
        // @ts-expect-error testing validation
        refinedText: 6,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("refinedText");
      expect(json.error.issues[0].code).toBe(ZodIssueCode.invalid_type);
    }
  });

  it("patch /refinements/{id} validates empty body", async () => {
    const response = await client.refinements[":id"].$patch({
      param: {
        id: existingRefinementId,
      },
      json: {},
    });
    expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_UPDATES);
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.NO_UPDATES);
    }
  });

  it("patch /refinements/{id} updates a single property of a refinement", async () => {
    const response = await client.refinements[":id"].$patch({
      param: {
        id: existingRefinementId,
      },
      json: {
        refinedText: "this is an updated refined text",
      },
    });
    expect(response.status).toBe(HttpStatusCodes.OK);
    if (response.status === HttpStatusCodes.OK) {
      const json = await response.json();
      expect(json.refinedText).toBe("this is an updated refined text");
    }
  });

  it("delete /refinements/{id} removes a refinement", async () => {
    const response = await client.refinements[":id"].$delete({
      param: {
        id: existingRefinementId,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.NO_CONTENT);
  });
});
