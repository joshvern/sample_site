import { parse } from "csv-parse/sync";
import {
  EXPECTED_CSV_FIELDS,
  MAX_CSV_BYTES,
  MAX_CSV_ROWS,
  validateCsvRows,
} from "./validation";
import { AppError } from "@/lib/errors";

const allowedMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "",
]);

export function assertCsvFile(file: File) {
  if (file.size > MAX_CSV_BYTES) {
    throw new AppError("validation", "CSV files are limited to 2 MiB.");
  }
  if (
    !file.name.toLowerCase().endsWith(".csv") ||
    !allowedMimeTypes.has(file.type)
  ) {
    throw new AppError("validation", "Upload a valid .csv file.");
  }
}

export async function parseCsvFile(
  file: File,
  columnMap: Record<string, string> = {},
) {
  assertCsvFile(file);
  const text = await file.text();
  let rawRows: Array<Record<string, string>>;
  try {
    rawRows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Array<Record<string, string>>;
  } catch (error) {
    throw new AppError("validation", "The CSV could not be parsed.", error);
  }

  if (rawRows.length > MAX_CSV_ROWS) {
    throw new AppError(
      "validation",
      "CSV files are limited to 5,000 data rows.",
    );
  }
  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  if (headers.length === 0) {
    throw new AppError("validation", "The CSV does not contain a header row.");
  }

  const inferredMap = Object.fromEntries(
    EXPECTED_CSV_FIELDS.map((expected) => [
      expected,
      columnMap[expected] ??
        headers.find(
          (header) =>
            header.toLowerCase().replaceAll(" ", "_") ===
            expected.toLowerCase(),
        ) ??
        "",
    ]),
  );
  const mappedRows = rawRows.map((row) =>
    Object.fromEntries(
      EXPECTED_CSV_FIELDS.map((expected) => [
        expected,
        inferredMap[expected] ? (row[inferredMap[expected]] ?? "") : "",
      ]),
    ),
  );
  const validation = validateCsvRows(mappedRows);

  return {
    headers,
    columnMap: inferredMap,
    rawRows,
    mappedRows,
    preview: mappedRows.slice(0, 20),
    ...validation,
  };
}
