import { test, expect } from "@playwright/test";

// Flow 1: Besøgende finder og filtrerer biler
test("besøgende kan finde og filtrere biler", async ({ page }) => {
  await page.goto("/biler");
  await page.getByRole("button", { name: "Afvis alle" }).click();

  await expect(page.getByRole("heading", { name: "Biler til salg" })).toBeVisible();
  const cards = page.getByRole("list").filter({ has: page.getByRole("article") }).first();
  await expect(cards.getByRole("article").first()).toBeVisible();

  // Filtrér: kun elbiler (desktop-sidebar eller mobil-drawer)
  const filterButton = page.getByRole("button", { name: /Filtre/ });
  if (await filterButton.isVisible()) await filterButton.click();
  await page.getByLabel("Kun elbiler").check();
  await expect(page).toHaveURL(/kun_el=1/);
});

// Flow 2: Besøgende åbner en bil og sender en forespørgsel
test("besøgende kan sende en forespørgsel på en bil", async ({ page }) => {
  await page.goto("/biler");
  await page.getByRole("button", { name: "Afvis alle" }).click();
  await page.getByRole("article").first().getByRole("link").first().click();

  await expect(page.getByRole("heading", { name: "Send en forespørgsel" }).first()).toBeVisible();
  await page.getByLabel("Navn *").fill("E2E Test (TESTDATA)");
  await page.getByLabel("Telefon *").fill("+45 00 00 00 00");
  await page.getByLabel("E-mail *").fill("e2e@example.invalid");
  await page.getByText(/Jeg accepterer, at .* behandler mine oplysninger/).click();
  await page.getByRole("button", { name: "Send forespørgsel" }).click();

  await expect(page.getByText("Tak for din henvendelse")).toBeVisible();
});

// Flow 3: Besøgende udfylder salgsvurderingen (demo-mode med mock-provider)
test("besøgende kan gennemføre salgsvurderingen", async ({ page }) => {
  await page.goto("/saelg-din-bil");
  await page.getByRole("button", { name: "Afvis alle" }).click();

  // Trin 1
  await page.getByLabel("Nummerplade *").fill("AB12345");
  await page.getByLabel("Kilometerstand *").fill("85000");
  await page.getByRole("button", { name: "Find min bil" }).click();

  // Trin 2 (mockdata markeret)
  await expect(page.getByText("Er dette din bil?")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("DEMO-MODE")).toBeVisible();
  await page.getByRole("button", { name: "Ja, det er min bil" }).click();

  // Trin 3: tilstand
  await page.getByRole("group", { name: /Er bilen kørende/ }).getByText("Ja", { exact: true }).click();
  await page.getByRole("group", { name: /servicebog/ }).getByText("Ja, fuld").click();
  await page.getByRole("group", { name: /nøgler/ }).getByText("2", { exact: true }).click();
  await page.getByRole("group", { name: /skader, ridser/ }).getByText("Nej", { exact: true }).click();
  await page.getByRole("group", { name: /advarselslamper/ }).getByText("Nej", { exact: true }).click();
  await page.getByRole("group", { name: /røgfri/ }).getByText("Ja", { exact: true }).click();
  await page.getByRole("group", { name: /restgæld/ }).getByText("Nej", { exact: true }).click();
  await page.getByRole("group", { name: /Hvornår ønsker du at sælge/ }).getByText("Hurtigst muligt").click();
  await page.getByRole("button", { name: "Fortsæt" }).click();

  // Trin 4: billeder (springes over)
  await page.getByRole("button", { name: "Fortsæt uden billeder" }).click();

  // Trin 5: kontakt
  await page.getByLabel("Navn *").fill("E2E Sælger (TESTDATA)");
  await page.getByLabel("Telefon *").fill("+45 00 00 00 00");
  await page.getByLabel("E-mail *").fill("e2e-saelger@example.invalid");
  await page.getByLabel("Postnummer *").fill("6700");
  await page.getByRole("group", { name: /Hvordan må vi kontakte dig/ }).getByText("Telefon").click();
  await page.getByRole("button", { name: "Fortsæt" }).click();

  // Trin 6: samtykke + send
  await page.getByText(/Jeg accepterer, at .* behandler mine oplysninger/).click();
  await page.getByRole("button", { name: "Send min henvendelse" }).click();

  // Bekræftelse med reference
  await expect(page.getByText("Tak for din henvendelse!")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/DEMO-\d{4}-\d+/)).toBeVisible();
});
