import dedent from "dedent";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { z } from "zod";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { refinements } from "@/db/schema";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/lib/constants";

import type { ConvertToMarkdownRoute, CreateRoute, GetOneRoute, ListRoute, PatchRoute, RemoveRoute } from "./refinements.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const refinements = await db.query.refinements.findMany();
  return c.json(refinements, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const refinementsPayload = c.req.valid("json");

  const openai = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  const RefinedCopy = z.object({
    refined_copy: z.string(),
    explanation: z.string().optional(),
  });

  const completion = c.env.NODE_ENV === "test"
    ? {
        choices: [
          {
            message: {
              parsed: {
                refined_copy: "This is a test refined copy",
                explanation: "This is a test explanation",
              },
            },
          },
        ],
      }
    : await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: dedent`
        You are a professional copy editor dedicated to refining the original text provided.
        Your mission is to:
        - Focus exclusively on refining the original text.
        - Eliminate redundant or filler words.
        - Enhance clarity and flow.
        - Preserve the original message and tone.

        IMPORTANT:
        - Do not edit the additional context; it is provided solely for informational purposes to guide your refinement of the original text.
        - Your task is to refine only the original text, using the context to inform your edits without altering it.
        - Be sure to make grammatical changes to the original text where necessary.
        - There's a translation trigger phrase that you should be aware of:
          - "Hey Jeff, translate this to <target language>"
          - If you see this as the start of the original text, you should translate the original text to the target language.

        Provide the following JSON:
        {
          refined_copy: string,
          explanation: string,
        }

        The refined_copy should be a string of the refined text.
        The explanation, where applicable, should be a string explaining the changes made.
      ` },
        { role: "user", content: dedent`
        Help me refine the following text, please only refine the original text,
        DO NOT include any text from the additional context.
        Original Text: ${refinementsPayload.originalText}

        Here's some additional context to help you understand the context of the original text:
        Additional Context: ${refinementsPayload.additionalContext}
      ` },
      ],
      response_format: zodResponseFormat(RefinedCopy, "refined_copy"),
    });

  const refinement = completion.choices[0].message.parsed;

  // fake the embedding in TEST environment
  const fakeEmbedding = Array.from({ length: 1536 }, () => Math.floor(Math.random() * 100));
  const embedding = c.env.NODE_ENV !== "test"
    ? await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: refinement?.refined_copy ?? refinementsPayload.originalText,
      encoding_format: "float",
    })
    : {
        object: "list",
        data: [
          {
            object: "embedding",
            index: 0,
            embedding: fakeEmbedding,
          },
        ],
      };

  const [inserted] = await db.insert(refinements)
    .values({
      userId: refinementsPayload.userId,
      originalText: refinementsPayload.originalText,
      refinedText: refinement?.refined_copy ?? "",
      explanation: refinement?.explanation,
      vector: embedding.data[0].embedding,
    })
    .returning();

  return c.json(
    { ...inserted, explanation: refinement?.explanation },
    HttpStatusCodes.CREATED,
  );
};

export const convertToMarkdown: AppRouteHandler<ConvertToMarkdownRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const payload = c.req.valid("json");

  const openai = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  const Markdown = z.object({
    markdown: z.string(),
  });

  const completion = c.env.NODE_ENV === "test"
    ? {
        choices: [
          {
            message: {
              parsed: {
                markdown: "This is a test markdown",
              },
            },
          },
        ],
      }
    : await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: dedent`
        You are a professional text converter specializing in transforming HTML content into Markdown format.
        Your mission is to:
        - Accurately convert HTML elements to their Markdown equivalents.
        - Preserve the structure and content of the original HTML.
        - Ensure the Markdown output is clean, readable, and maintains the original intent.
        - <code> tags should be converted to markdown code blocks.

        IMPORTANT:
        - Focus solely on converting the HTML provided.
        - Do not alter the content or structure beyond necessary Markdown formatting.
        - Ensure that all HTML tags are appropriately converted to Markdown syntax.

        Provide the following JSON:
        {
          markdown: string,
        }

        The markdown should be a string representing the converted Markdown text.
      ` },
        { role: "user", content: dedent`
        Convert the following HTML to markdown.

        HTML:
        ${payload.html}
      ` },
      ],
      response_format: zodResponseFormat(Markdown, "markdown"),
    });

  const parsedMessage = completion.choices[0].message.parsed;

  return c.json(
    {
      markdown: parsedMessage?.markdown ?? "",
    },
    HttpStatusCodes.CREATED,
  );
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");

  const refinementRecord = await db.query.refinements.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });

  if (!refinementRecord) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(refinementRecord, HttpStatusCodes.OK);
};

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");
  const updates = c.req.valid("json");

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        success: false,
        error: {
          issues: [
            {
              code: ZOD_ERROR_CODES.INVALID_UPDATES,
              path: [],
              message: ZOD_ERROR_MESSAGES.NO_UPDATES,
            },
          ],
          name: "ZodError",
        },
      },
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  const [updatedRecord] = await db.update(refinements)
    .set(updates)
    .where(eq(refinements.id, id))
    .returning();

  if (!updatedRecord) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.json(updatedRecord, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { db } = await createDb(c.env);
  const { id } = c.req.valid("param");
  const result = await db.delete(refinements)
    .where(eq(refinements.id, id));

  if (result.rowsAffected === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};
