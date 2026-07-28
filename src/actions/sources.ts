"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { sourceSystem } from "@/db/schemas";
import { AppError, toActionError, type ActionResult } from "@/lib/errors";
import { hasDatabase } from "@/lib/env";
import { getCurrentWorkspace } from "@/lib/workspace";

const sourceInput = z.object({
  name: z.string().trim().min(2).max(100),
});

export async function createSourceSystemAction(
  name: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    if (!hasDatabase()) {
      throw new AppError(
        "database_failure",
        "Connect a Neon database before creating source systems.",
      );
    }
    const input = sourceInput.parse({ name });
    const workspace = await getCurrentWorkspace();
    const db = getDb();
    const [existing] = await db
      .select()
      .from(sourceSystem)
      .where(
        and(
          eq(sourceSystem.workspaceId, workspace.id),
          eq(sourceSystem.name, input.name),
        ),
      )
      .limit(1);
    if (existing) {
      throw new AppError("conflict", "A source system with this name exists.");
    }
    const [created] = await db
      .insert(sourceSystem)
      .values({
        workspaceId: workspace.id,
        name: input.name,
        sourceType: "csv_upload",
      })
      .returning();
    if (!created)
      throw new AppError("database_failure", "Source was not created.");
    revalidatePath("/sources");
    revalidatePath("/ingest");
    return { ok: true, data: { id: created.id, name: created.name } };
  } catch (error) {
    return toActionError(error);
  }
}
