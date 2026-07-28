import { test, expect } from "@playwright/test";

async function loginAsDemoAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel("E-mail").fill("demo@demo.dk");
  await page.getByLabel("Adgangskode").fill("demo1234");
  await page.getByRole("button", { name: "Log ind" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

// Flow 4: Administrator logger ind
test("administrator kan logge ind og ser dashboard", async ({ page }) => {
  await loginAsDemoAdmin(page);
  await expect(page.getByText("Aktive biler")).toBeVisible();
  await expect(page.getByText("Nye leads")).toBeVisible();
});

// Flow 5: Administrator opretter og publicerer en bil
test("administrator kan oprette og publicere en bil", async ({ page }) => {
  await loginAsDemoAdmin(page);
  await page.getByRole("link", { name: "Biler" }).click();
  await page.getByRole("link", { name: "Opret bil" }).click();

  await page.getByLabel("Mærke *").fill("Testmærke");
  await page.getByLabel("Model *").fill("Testmodel");
  await page.getByLabel("Kontantpris (kr.)").fill("199900");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Gem" }).click();

  await expect(page.getByRole("link", { name: /Testmærke Testmodel/ })).toBeVisible();
});

// Flow 6: Administrator behandler et lead
test("administrator kan behandle et lead", async ({ page }) => {
  await loginAsDemoAdmin(page);
  await page.getByRole("link", { name: "Leads" }).click();
  await page.getByRole("link", { name: "AVEST-2026-0001" }).click();

  await expect(page.getByText("Test Testesen (TESTDATA)")).toBeVisible();

  // Tilføj note
  await page.getByLabel("Ny note").fill("E2E: Kunden er ringet op.");
  await page.getByRole("button", { name: "Gem note" }).click();
  await expect(page.getByText("E2E: Kunden er ringet op.")).toBeVisible();

  // Skift status
  await page.getByLabel("Skift status").selectOption("contacted");
  await expect(page.getByText("Kontaktet").first()).toBeVisible();
});

// Flow 7: Tenant-isolation.
// Den autoritative test af, at en administrator fra Autohuset V ikke kan tilgå
// Autohuset Vests data, ligger i Row Level Security-politikkerne og verificeres
// med SQL-testen i supabase/tests/rls-isolation.sql mod et rigtigt Supabase-projekt.
test("adminpanelet kræver login", async ({ page }) => {
  await page.goto("/admin/leads");
  await expect(page.getByLabel("E-mail")).toBeVisible();
});
