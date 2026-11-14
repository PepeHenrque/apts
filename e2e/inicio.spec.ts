import { expect, test } from "@playwright/test";

test("tela inicial abre e mostra o aviso de estimativa", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "apts" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("Simulações são estimativas");
});
