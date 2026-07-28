import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/lib/env";
import { parseCsvFile } from "@/lib/ingestion/csv";
import { ingestRows } from "@/lib/ingestion/service";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        error:
          "CSV preview is available, but ingestion requires DATABASE_URL and a seeded workspace.",
      },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const sourceSystemId = z.uuid().parse(form.get("sourceSystemId"));
    if (!(file instanceof File)) {
      throw new AppError("validation", "CSV file is required.");
    }
    const rawMap = form.get("columnMap");
    const columnMap =
      typeof rawMap === "string" && rawMap
        ? (JSON.parse(rawMap) as Record<string, string>)
        : {};
    const parsed = await parseCsvFile(file, columnMap);
    const summary = await ingestRows({
      sourceSystemId,
      rows: parsed.valid,
      receivedCount: parsed.rawRows.length,
      failures: parsed.failures,
      filename: file.name,
    });
    return NextResponse.json(summary);
  } catch (error) {
    const message =
      error instanceof AppError || error instanceof Error
        ? error.message
        : "Ingestion failed.";
    console.error("CSV ingestion failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
