import { createClient } from "@deepgram/sdk";
import dedent from "dedent";
import { Buffer } from "node:buffer";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";

import type { AppRouteHandler } from "@/lib/types";

import { createDb } from "@/db";
import { refinements } from "@/db/schema";

import type { CreateRoute } from "./transcribe.routes";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    return c.json(
      { error: "No valid file provided" },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    const deepgram = createClient(c.env.DEEPGRAM_API_KEY);
    const buffer = await file.arrayBuffer();

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(buffer),
      {
        model: "nova-2",
        smart_format: true,
        // TODO: add language support
        // language: body?.language || "en",
      },
    );

    const trancription = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!trancription) {
      return c.json(
        { error: "Failed to get transcription" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    const shouldRefine = body?.refine === "true";
    const userId = String(body?.userId ?? "");

    if (shouldRefine && userId !== "") {
      const { db } = await createDb(c.env);

      const openai = new OpenAI({
        apiKey: c.env.OPENAI_API_KEY,
      });

      const RefinedCopy = z.object({
        refined_copy: z.string(),
        explanation: z.string().optional(),
      });

      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: dedent`
           You are a professional copy editor dedicated to refining the original text provided. Your mission is to:
            - Focus exclusively on refining the original text.
            - Eliminate redundant or filler words.
            - Enhance clarity and flow.
            - Preserve the original message and tone.
            - Translate the refined_copy to the target language if the translation trigger phrase is present.

            IMPORTANT:
            - There's a translation trigger phrase that you should be aware of:
              - "Hey Jeff translate this to <target language>"
              - If you see this as the start of the original text, you should translate the refined_copy to the target language.

            Provide the following JSON:
            {
              refined_copy: string,
              explanation: string,
            }
          ` },
          { role: "user", content: trancription },
        ],
        response_format: zodResponseFormat(RefinedCopy, "refined_copy"),
        temperature: 1,
      });

      const refinement = completion.choices[0].message.parsed;

      // fake the embedding in TEST environment
      const fakeEmbedding = Array.from({ length: 1536 }, () => Math.floor(Math.random() * 100));
      const embedding = c.env.NODE_ENV !== "test"
        ? await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: refinement?.refined_copy ?? trancription,
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
          userId,
          originalText: trancription,
          originalTextWordCount: trancription.split(" ").filter(word => word !== "").length,
          refinedText: refinement?.refined_copy ?? "",
          refinedTextWordCount: refinement?.refined_copy?.split(" ").filter(word => word !== "").length ?? 0,
          explanation: refinement?.explanation,
          vector: embedding.data[0].embedding,
        })
        .returning();

      console.log("inserted", inserted);

      return c.json(
        {
          transcription: result.results.channels[0].alternatives[0].transcript,
          refined: refinement?.refined_copy,
          explanation: refinement?.explanation,
        },
        HttpStatusCodes.CREATED,
      );
    }

    return c.json(
      { transcription: result.results.channels[0].alternatives[0].transcript },
      HttpStatusCodes.CREATED,
    );
  }
  catch (error) {
    console.error("Transcription error:", error);
    return c.json(
      { error: "Failed to transcribe file" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
