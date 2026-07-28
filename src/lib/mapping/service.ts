import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  content,
  contentMapping,
  contentTitle,
  contentType,
  matchCandidate,
  sourceEntity,
} from "@/db/schemas";
import { rebuildCanonicalMetrics } from "@/lib/aggregation/rebuild";
import { AppError } from "@/lib/errors";
import { normalizeTitle } from "@/lib/title-normalization";
import { getCurrentWorkspace } from "@/lib/workspace";

export interface MapSourceInput {
  sourceEntityId: string;
  contentId: string;
  confidence: number;
  method: "automatic" | "manual" | "external_id" | "seed";
  candidateId?: string;
  notes?: string;
}

export async function mapSourceEntity(input: MapSourceInput) {
  const db = getDb();
  const workspace = await getCurrentWorkspace();

  return db.transaction(async (tx) => {
    const [source] = await tx
      .select()
      .from(sourceEntity)
      .where(
        and(
          eq(sourceEntity.id, input.sourceEntityId),
          eq(sourceEntity.workspaceId, workspace.id),
        ),
      )
      .for("update")
      .limit(1);
    if (!source) {
      throw new AppError("not_found", "Source entity was not found.");
    }

    const [canonical] = await tx
      .select({ id: content.id })
      .from(content)
      .where(eq(content.id, input.contentId))
      .limit(1);
    if (!canonical) {
      throw new AppError("not_found", "Canonical content was not found.");
    }

    const [active] = await tx
      .select()
      .from(contentMapping)
      .where(
        and(
          eq(contentMapping.sourceEntityId, source.id),
          eq(contentMapping.decisionStatus, "accepted"),
          isNull(contentMapping.validTo),
        ),
      )
      .for("update")
      .limit(1);

    if (active?.contentId === input.contentId) {
      throw new AppError(
        "mapping_conflict",
        "This source entity is already mapped to that content.",
      );
    }

    const now = new Date();
    if (active) {
      await tx
        .update(contentMapping)
        .set({ validTo: now })
        .where(eq(contentMapping.id, active.id));
    }

    const [mapping] = await tx
      .insert(contentMapping)
      .values({
        workspaceId: workspace.id,
        sourceEntityId: source.id,
        contentId: input.contentId,
        decisionMethod: input.method,
        decisionStatus: "accepted",
        confidence: input.confidence.toFixed(4),
        decidedBy: input.method === "manual" ? "demo-reviewer" : null,
        notes: input.notes,
        validFrom: now,
      })
      .returning();

    await tx
      .update(matchCandidate)
      .set({ status: "superseded", evaluatedAt: now })
      .where(
        and(
          eq(matchCandidate.sourceEntityId, source.id),
          eq(matchCandidate.status, "pending"),
        ),
      );

    if (input.candidateId) {
      await tx
        .update(matchCandidate)
        .set({ status: "accepted", evaluatedAt: now })
        .where(
          and(
            eq(matchCandidate.id, input.candidateId),
            eq(matchCandidate.sourceEntityId, source.id),
            eq(matchCandidate.contentId, input.contentId),
          ),
        );
    }

    await rebuildCanonicalMetrics(tx, {
      workspaceId: workspace.id,
      contentIds: [input.contentId, ...(active ? [active.contentId] : [])],
    });

    if (!mapping)
      throw new AppError("database_failure", "Mapping was not created.");
    return mapping;
  });
}

export async function acceptCandidate(candidateId: string) {
  const workspace = await getCurrentWorkspace();
  const [candidate] = await getDb()
    .select()
    .from(matchCandidate)
    .where(
      and(
        eq(matchCandidate.id, candidateId),
        eq(matchCandidate.workspaceId, workspace.id),
        eq(matchCandidate.status, "pending"),
      ),
    )
    .limit(1);
  if (!candidate) {
    throw new AppError("not_found", "Pending candidate was not found.");
  }

  return mapSourceEntity({
    sourceEntityId: candidate.sourceEntityId,
    contentId: candidate.contentId,
    confidence: Number(candidate.score),
    method: "manual",
    candidateId: candidate.id,
  });
}

export async function rejectCandidate(candidateId: string, notes?: string) {
  const db = getDb();
  const workspace = await getCurrentWorkspace();

  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select()
      .from(matchCandidate)
      .where(
        and(
          eq(matchCandidate.id, candidateId),
          eq(matchCandidate.workspaceId, workspace.id),
          eq(matchCandidate.status, "pending"),
        ),
      )
      .for("update")
      .limit(1);
    if (!candidate) {
      throw new AppError("not_found", "Pending candidate was not found.");
    }

    const now = new Date();
    await tx
      .update(matchCandidate)
      .set({ status: "rejected", evaluatedAt: now })
      .where(eq(matchCandidate.id, candidate.id));

    const [decision] = await tx
      .insert(contentMapping)
      .values({
        workspaceId: workspace.id,
        sourceEntityId: candidate.sourceEntityId,
        contentId: candidate.contentId,
        decisionMethod: "manual",
        decisionStatus: "rejected",
        confidence: candidate.score,
        decidedBy: "demo-reviewer",
        notes,
        validFrom: now,
        validTo: now,
      })
      .returning();
    return decision;
  });
}

export async function unmapSourceEntity(sourceEntityId: string) {
  const db = getDb();
  const workspace = await getCurrentWorkspace();
  return db.transaction(async (tx) => {
    const active = await tx
      .select()
      .from(contentMapping)
      .where(
        and(
          eq(contentMapping.workspaceId, workspace.id),
          eq(contentMapping.sourceEntityId, sourceEntityId),
          eq(contentMapping.decisionStatus, "accepted"),
          isNull(contentMapping.validTo),
        ),
      )
      .for("update");
    if (active.length === 0) {
      throw new AppError("not_found", "No active mapping was found.");
    }
    await tx
      .update(contentMapping)
      .set({ validTo: new Date() })
      .where(
        inArray(
          contentMapping.id,
          active.map((item) => item.id),
        ),
      );
    await rebuildCanonicalMetrics(tx, {
      workspaceId: workspace.id,
      contentIds: active.map((item) => item.contentId),
    });
    return active[0];
  });
}

export async function createCanonicalContentFromSource(
  sourceEntityId: string,
  overrides: {
    displayTitle?: string;
    contentType?: string;
    releaseYear?: number;
    countryCode?: string;
  } = {},
) {
  const db = getDb();
  const workspace = await getCurrentWorkspace();
  const [source] = await db
    .select()
    .from(sourceEntity)
    .where(
      and(
        eq(sourceEntity.id, sourceEntityId),
        eq(sourceEntity.workspaceId, workspace.id),
      ),
    )
    .limit(1);
  if (!source) throw new AppError("not_found", "Source entity was not found.");

  const typeKey = overrides.contentType ?? source.entityType;
  const [type] = await db
    .select()
    .from(contentType)
    .where(eq(contentType.key, typeKey))
    .limit(1);
  if (!type) throw new AppError("validation", "Unsupported content type.");

  const canonical = await db.transaction(async (tx) => {
    const title = overrides.displayTitle ?? source.rawTitle;
    const [created] = await tx
      .insert(content)
      .values({
        contentTypeId: type.id,
        displayTitle: title,
        releaseYear: overrides.releaseYear ?? source.releaseYear,
        originCountry: overrides.countryCode ?? source.countryCode,
        originalLanguage: source.languageCode,
        status: "active",
      })
      .returning();
    if (!created)
      throw new AppError("database_failure", "Content was not created.");
    const normalized = normalizeTitle(title);
    await tx.insert(contentTitle).values({
      contentId: created.id,
      title,
      normalizedTitle: normalized.normalized,
      normalizationVersion: normalized.normalizationVersion,
      titleType: "official",
      languageCode: source.languageCode,
      countryCode: overrides.countryCode ?? source.countryCode,
      isPrimary: true,
    });
    return created;
  });

  await mapSourceEntity({
    sourceEntityId,
    contentId: canonical.id,
    confidence: 1,
    method: "manual",
    notes: "Created from source entity during review.",
  });
  return canonical;
}
