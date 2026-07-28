import { NextResponse } from "next/server";
import { parseCsvFile } from "@/lib/ingestion/csv";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required." },
        { status: 400 },
      );
    }
    const rawMap = form.get("columnMap");
    const columnMap =
      typeof rawMap === "string" && rawMap
        ? (JSON.parse(rawMap) as Record<string, string>)
        : {};
    const parsed = await parseCsvFile(file, columnMap);
    return NextResponse.json({
      filename: file.name,
      headers: parsed.headers,
      columnMap: parsed.columnMap,
      preview: parsed.preview,
      rowCount: parsed.rawRows.length,
      validCount: parsed.valid.length,
      failures: parsed.failures,
    });
  } catch (error) {
    const message =
      error instanceof AppError ? error.message : "CSV preview failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
