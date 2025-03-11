import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());

  throw new Error("Invalid environment variables");
}

export const env = _env.data;

export type Env = z.infer<typeof envSchema>;
