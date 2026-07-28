import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testUrl ? describe : describe.skip;
let pool: Pool;

describeWithDatabase("canonical data backbone", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: testUrl });
    await pool.query(`
      drop schema if exists analytics cascade;
      drop schema if exists resolution cascade;
      drop schema if exists ingest cascade;
      drop schema if exists catalog cascade;
      drop schema if exists app cascade;
    `);
    const migration = readFileSync(
      path.resolve("src/db/migrations/0000_pale_malice.sql"),
      "utf8",
    ).replaceAll("--> statement-breakpoint", "");
    await pool.query(migration);
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testUrl },
      stdio: "pipe",
    });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("re-running seed is idempotent", () => {
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testUrl },
      stdio: "pipe",
    });
    return expect(
      pool.query("select count(*)::int as count from catalog.content"),
    ).resolves.toMatchObject({ rows: [{ count: 4 }] });
  });

  it("keeps US and UK editions distinct", async () => {
    const result = await pool.query(`
      select display_title, release_year, origin_country
      from catalog.content where display_title = 'The Office'
      order by release_year
    `);
    expect(result.rows).toEqual([
      { display_title: "The Office", release_year: 2001, origin_country: "GB" },
      { display_title: "The Office", release_year: 2005, origin_country: "US" },
    ]);
  });

  it("leaves the missing-year record unresolved with two candidates", async () => {
    const result = await pool.query(`
      select count(*)::int as candidates,
        count(cm.id)::int as active_mappings
      from resolution.match_candidate mc
      left join resolution.content_mapping cm
        on cm.source_entity_id = mc.source_entity_id
        and cm.decision_status = 'accepted' and cm.valid_to is null
      where mc.source_entity_id = '00000000-0000-4000-8000-000000000603'
      group by mc.source_entity_id
    `);
    expect(result.rows[0]).toEqual({ candidates: 2, active_mappings: 0 });
  });

  it("builds canonical metrics only through active mappings", async () => {
    const result = await pool.query(`
      select count(*)::int as days, sum(views)::bigint as views
      from analytics.content_metric_daily
      where content_id = '00000000-0000-4000-8000-000000000301'
    `);
    expect(result.rows[0].days).toBe(60);
    expect(Number(result.rows[0].views)).toBeGreaterThan(0);
  });

  it("database constraint prevents two active accepted mappings", async () => {
    await expect(
      pool.query(`
        insert into resolution.content_mapping (
          workspace_id, source_entity_id, content_id, decision_method,
          confidence, decision_status, valid_from
        ) values (
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000601',
          '00000000-0000-4000-8000-000000000302',
          'manual', 1, 'accepted', now()
        )
      `),
    ).rejects.toMatchObject({ code: "23505" });
  });
});
