import { describe, expect, it } from "vitest";
import { payloadChecksum } from "@/lib/ingestion/checksum";
import { validateCsvRows } from "@/lib/ingestion/validation";

describe("payload checksums", () => {
  it("is stable across object key order", () => {
    expect(payloadChecksum({ title: "The Office", year: 2005 })).toBe(
      payloadChecksum({ year: 2005, title: "The Office" }),
    );
  });

  it("changes when normalized payload content changes", () => {
    expect(payloadChecksum({ views: 10 })).not.toBe(
      payloadChecksum({ views: 11 }),
    );
  });
});

describe("CSV row validation", () => {
  it("accepts a valid metric row and coerces integers", () => {
    const result = validateCsvRows([
      {
        source_native_id: "office-1",
        title: "The Office",
        content_type: "series",
        release_year: "2005",
        country_code: "us",
        metric_date: "2026-07-28",
        views: "1200",
      },
    ]);
    expect(result.failures).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      release_year: 2005,
      country_code: "US",
      views: 1200,
    });
  });

  it("records malformed rows without rejecting valid rows", () => {
    const result = validateCsvRows([
      {
        source_native_id: "good",
        title: "Oppenheimer",
        content_type: "movie",
      },
      {
        source_native_id: "",
        title: "",
        content_type: "unknown",
      },
    ]);
    expect(result.valid).toHaveLength(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.row).toBe(3);
  });
});
