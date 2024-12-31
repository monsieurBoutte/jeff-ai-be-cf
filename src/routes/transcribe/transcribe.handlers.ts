import { createClient } from "@deepgram/sdk";
import dedent from "dedent";
import { Buffer } from "node:buffer";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";

import type { AppRouteHandler } from "@/lib/types";

import type { CreateRoute } from "./transcribe.routes";

async function refineCopy(text: string, openaiApiKey: string) {
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const RefinedCopy = z.object({
    refined_copy: z.string(),
    explanation: z.string().optional(),
  });

  const completion = await openai.beta.chat.completions.parse({
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
        - There's a translation trigger phrase that you should be aware of:
          - "Hey Jeff, translate this to <target language>"
          - If you see this as the start of the original text, you should translate the original text to the target language.

        Provide the following JSON:
        {
          refined_copy: string,
          explanation: string,
        }
      ` },
      { role: "user", content: `Help me refine the following text: ${text}` },
    ],
    response_format: zodResponseFormat(RefinedCopy, "refined_copy"),
    temperature: 1,
  });

  return completion.choices[0].message.parsed;
}

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

    console.log("result", JSON.stringify(result, null, 2));

    if (!result?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      return c.json(
        { error: "Failed to get transcription" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    const shouldRefine = body?.refine === "true";

    if (shouldRefine) {
      const refined = await refineCopy(
        result.results.channels[0].alternatives[0].transcript,
        c.env.OPENAI_API_KEY,
      );
      return c.json(
        {
          transcription: result.results.channels[0].alternatives[0].transcript,
          refined: refined?.refined_copy,
          explanation: refined?.explanation,
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
