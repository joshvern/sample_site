import "server-only";
import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export function getEnvironment() {
  return environmentSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
