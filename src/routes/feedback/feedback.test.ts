import { testClient } from "hono/testing";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { describe, expect, expectTypeOf, it } from "vitest";
import { ZodIssueCode } from "zod";

import env from "@/env-runtime";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";
import createApp from "@/lib/create-app";

import router from "./feedback.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

const stableTestUserId = "foo";
const featureType = "refinements";
const featureId = "foo-refinement-id-1";
const comment = "This is refinement feedback";
const rating = 1;

let existingFeedbackId = "mPWX9qMys5BORyY";

describe("feedback routes", () => {
  it("post /feedback validates the body when creating", async () => {
    const response = await client.feedback.$post({
      // @ts-expect-error testing validation
      json: {
        userId: stableTestUserId,
        // featureType, <-- intentionally missing
        featureId,
        comment,
        rating,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("featureType");
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.REQUIRED);
    }
  });

  it("post /feedback creates a feedback", async () => {
    const response = await client.feedback.$post({
      json: {
        userId: stableTestUserId,
        featureType,
        featureId,
        comment,
        rating,
      },
    });

    expect(response.status).toBe(HttpStatusCodes.CREATED);
    if (response.status === HttpStatusCodes.CREATED) {
      const json = await response.json();
      existingFeedbackId = json.id;
      expect(json.id).toBeDefined();
      expect(json.userId).toBe(stableTestUserId);
      expect(json.featureType).toBe(featureType);
      expect(json.featureId).toBe(featureId);
      expect(json.comment).toBe(comment);
      expect(json.rating).toBe(rating);
    }
  });

  it("get /feedback lists all feedback", async () => {
    const response = await client.feedback.$get();
    expect(response.status).toBe(HttpStatusCodes.OK);
    if (response.status === HttpStatusCodes.OK) {
      const json = await response.json();
      expectTypeOf(json).toBeArray();
      // this is the number of feedback seeded in the src/db/seed.ts file
      // plus the one we created in the previous test
      expect(json.length).toBe(11);
    }
  });

  it("get /feedback/{id} returns 404 when feedback not found", async () => {
    const response = await client.feedback[":id"].$get({
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

  it("get /feedback/{id} gets a single feedback", async () => {
    const response = await client.feedback[":id"].$get({
      param: {
        id: existingFeedbackId,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.OK);
  });

  it("patch /feedback/{id} validates the body when updating", async () => {
    const response = await client.feedback[":id"].$patch({
      param: {
        id: existingFeedbackId,
      },
      json: {
        // @ts-expect-error testing validation
        comment: 6,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
    if (response.status === HttpStatusCodes.UNPROCESSABLE_ENTITY) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("comment");
      expect(json.error.issues[0].code).toBe(ZodIssueCode.invalid_type);
    }
  });

  it("patch /feedback/{id} validates empty body", async () => {
    const response = await client.feedback[":id"].$patch({
      param: {
        id: existingFeedbackId,
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

  it("patch /feedback/{id} updates a single property of a feedback", async () => {
    const response = await client.feedback[":id"].$patch({
      param: {
        id: existingFeedbackId,
      },
      json: {
        comment: "this is an updated comment",
      },
    });
    expect(response.status).toBe(HttpStatusCodes.OK);
    if (response.status === HttpStatusCodes.OK) {
      const json = await response.json();
      expect(json.comment).toBe("this is an updated comment");
    }
  });

  it("delete /feedback/{id} removes a feedback", async () => {
    const response = await client.feedback[":id"].$delete({
      param: {
        id: existingFeedbackId,
      },
    });
    expect(response.status).toBe(HttpStatusCodes.NO_CONTENT);
  });
});
