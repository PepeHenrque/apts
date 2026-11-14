import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("apts:quem", "Teste"));
});

test("tour aparece no primeiro acesso, avança e não volta depois de dispensado", async ({
  page,
}) => {
  await page.goto("/");
  const tour = page.getByTestId("tour");
  await expect(tour).toContainText("Bem-vindos");
  await tour.getByRole("button", { name: "Próximo" }).click();
  await expect(tour).toContainText("Nossa situação");
  await tour.getByRole("button", { name: "Voltar" }).click();
  await expect(tour).toContainText("Bem-vindos");
  await tour.getByRole("button", { name: "Não mostrar de novo" }).click();
  await expect(tour).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("aviso-estimativa")).toBeVisible();
  await expect(page.getByTestId("tour")).toHaveCount(0);

  // O botão de ajuda reabre o tour.
  await page.getByRole("button", { name: "Ajuda: rever o tour do app" }).click();
  await expect(page.getByTestId("tour")).toContainText("Bem-vindos");
});

test("a ajuda da tela pode ser recolhida e o app lembra", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("apts:tour:v1", "visto"));
  await page.goto("/simulador");
  const botao = page.getByRole("button", { name: "Como funciona esta tela" });
  await botao.click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Mostrar ajuda desta tela" })).toBeVisible();
});
