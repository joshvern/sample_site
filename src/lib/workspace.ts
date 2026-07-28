import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { workspace } from "@/db/schemas";
import { AppError } from "./errors";

export const DEMO_WORKSPACE_SLUG = "demo";

export async function getCurrentWorkspace() {
  const [current] = await getDb()
    .select()
    .from(workspace)
    .where(eq(workspace.slug, DEMO_WORKSPACE_SLUG))
    .limit(1);

  if (!current) {
    throw new AppError(
      "not_found",
      "Demo workspace not found. Run pnpm db:seed.",
    );
  }
  return current;
}

export function assertWorkspace(
  actualWorkspaceId: string,
  expectedWorkspaceId: string,
) {
  if (actualWorkspaceId !== expectedWorkspaceId) {
    throw new AppError(
      "unauthorized_workspace",
      "The requested record does not belong to this workspace.",
    );
  }
}
