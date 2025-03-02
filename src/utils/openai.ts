import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
    baseURL: "https://models.inference.ai.azure.com",
});
