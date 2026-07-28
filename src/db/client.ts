import "server-only";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool as PostgresPool } from "pg";
import ws from "ws";
import { getEnvironment } from "@/lib/env";
import { schema } from "./schemas";

neonConfig.webSocketConstructor = ws;

function createNeonDatabase(databaseUrl: string) {
  const pool = new NeonPool({ connectionString: databaseUrl });
  return drizzleNeon({ client: pool, schema });
}

export type Database = ReturnType<typeof createNeonDatabase>;

function createDatabase(): Database {
  const databaseUrl = getEnvironment().DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Read-only demo pages remain available.",
    );
  }

  const hostname = new URL(databaseUrl).hostname;
  if (["localhost", "127.0.0.1", "postgres"].includes(hostname)) {
    const pool = new PostgresPool({ connectionString: databaseUrl });
    return drizzlePostgres({ client: pool, schema }) as unknown as Database;
  }

  return createNeonDatabase(databaseUrl);
}

let database: Database | undefined;

export function getDb(): Database {
  database ??= createDatabase();
  return database;
}
