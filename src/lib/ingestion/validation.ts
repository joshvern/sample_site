import { z } from "zod";

export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_ROWS = 5_000;

const optionalInteger = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z.number().int().nonnegative().optional(),
);

export const csvRowSchema = z.object({
  source_native_id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  content_type: z
    .enum([
      "franchise",
      "series",
      "season",
      "episode",
      "movie",
      "special",
      "live_event",
      "sports_event",
    ])
    .default("series"),
  release_year: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().int().min(1800).max(2200).optional(),
  ),
  country_code: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().length(2))
    .optional()
    .or(z.literal("")),
  language_code: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(z.string().min(2).max(8))
    .optional()
    .or(z.literal("")),
  platform: z.string().trim().min(1).optional().or(z.literal("")),
  metric_date: z.iso.date().optional().or(z.literal("")),
  views: optionalInteger,
  watch_seconds: optionalInteger,
  unique_viewers: optionalInteger,
  starts: optionalInteger,
  completions: optionalInteger,
  revenue_cents: optionalInteger,
  external_id: z.string().trim().optional().or(z.literal("")),
  external_id_namespace: z.string().trim().optional().or(z.literal("")),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export const EXPECTED_CSV_FIELDS = Object.keys(csvRowSchema.shape);

export interface RowFailure {
  row: number;
  issues: string[];
  input: Record<string, string>;
}

export function validateCsvRows(rows: Array<Record<string, string>>) {
  const valid: CsvRow[] = [];
  const failures: RowFailure[] = [];

  rows.forEach((row, index) => {
    const parsed = csvRowSchema.safeParse(row);
    if (parsed.success) valid.push(parsed.data);
    else {
      failures.push({
        row: index + 2,
        input: row,
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "row"}: ${issue.message}`,
        ),
      });
    }
  });

  return { valid, failures };
}
