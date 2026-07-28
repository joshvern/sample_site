"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  acceptCandidate,
  createCanonicalContentFromSource,
  mapSourceEntity,
  rejectCandidate,
  unmapSourceEntity,
} from "@/lib/mapping/service";
import { AppError, toActionError, type ActionResult } from "@/lib/errors";
import { hasDatabase } from "@/lib/env";

const idSchema = z.uuid();

function requireDatabase() {
  if (!hasDatabase()) {
    throw new AppError(
      "database_failure",
      "Connect a Neon database and run the seed before changing mappings.",
    );
  }
}

function refreshMappingPages() {
  revalidatePath("/resolution");
  revalidatePath("/dashboard");
  revalidatePath("/content");
}

export async function acceptCandidateAction(
  candidateId: string,
): Promise<ActionResult<{ mappingId: string }>> {
  try {
    requireDatabase();
    const parsedId = idSchema.parse(candidateId);
    const mapping = await acceptCandidate(parsedId);
    refreshMappingPages();
    return { ok: true, data: { mappingId: mapping.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: { code: "validation", message: "Invalid candidate identifier." },
      };
    }
    return toActionError(error);
  }
}

export async function rejectCandidateAction(
  candidateId: string,
): Promise<ActionResult<{ rejected: true }>> {
  try {
    requireDatabase();
    await rejectCandidate(idSchema.parse(candidateId));
    refreshMappingPages();
    return { ok: true, data: { rejected: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function mapSourceEntityAction(input: {
  sourceEntityId: string;
  contentId: string;
}): Promise<ActionResult<{ mappingId: string }>> {
  try {
    requireDatabase();
    const mapping = await mapSourceEntity({
      sourceEntityId: idSchema.parse(input.sourceEntityId),
      contentId: idSchema.parse(input.contentId),
      confidence: 1,
      method: "manual",
    });
    refreshMappingPages();
    return { ok: true, data: { mappingId: mapping.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createCanonicalFromSourceAction(
  sourceEntityId: string,
): Promise<ActionResult<{ contentId: string }>> {
  try {
    requireDatabase();
    const created = await createCanonicalContentFromSource(
      idSchema.parse(sourceEntityId),
    );
    refreshMappingPages();
    return { ok: true, data: { contentId: created.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unmapSourceEntityAction(
  sourceEntityId: string,
): Promise<ActionResult<{ unmapped: true }>> {
  try {
    requireDatabase();
    await unmapSourceEntity(idSchema.parse(sourceEntityId));
    refreshMappingPages();
    return { ok: true, data: { unmapped: true } };
  } catch (error) {
    return toActionError(error);
  }
}
