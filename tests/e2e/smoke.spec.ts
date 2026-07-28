import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";

test("dashboard loads with canonical metrics", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Content intelligence" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Key metrics").getByText("Canonical content"),
  ).toBeVisible();
  await expect(page.getByText("Views over time")).toBeVisible();
});

test("catalog loads, filters, and opens detail", async ({ page }) => {
  await page.goto("/content");
  await expect(page.getByRole("heading", { name: "Content" })).toBeVisible();
  await page.getByPlaceholder("Search titles and aliases…").fill("Oppenheimer");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("link", { name: "Oppenheimer" })).toBeVisible();
  await page.getByRole("link", { name: "Oppenheimer" }).click();
  await expect(
    page.getByRole("heading", { name: "Oppenheimer" }),
  ).toBeVisible();
  await expect(page.getByText("Connected source records")).toBeVisible();
});

test("resolution queue exposes actionable candidates", async ({ page }) => {
  await page.goto("/resolution");
  await expect(
    page.getByRole("heading", { name: "Resolution queue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reject" }).first(),
  ).toBeVisible();
});

test("CSV preview accepts the example file", async ({ page }) => {
  await page.goto("/ingest");
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve("public/examples/content-metrics-example.csv"));
  await expect(page.getByText("Map CSV columns")).toBeVisible();
  await expect(page.getByText("7 rows · 7 valid · 0 failed")).toBeVisible();
});

test("primary dashboard has no automatically detectable accessibility issues", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
