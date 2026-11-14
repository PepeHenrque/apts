import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Evita o pedido "Quem está usando este aparelho?" nos testes.
  await page.addInitScript(() => window.localStorage.setItem("apts:quem", "Teste"));
});

test("tela inicial mostra o semáforo e o aviso de estimativa", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("aviso-estimativa")).toContainText("Simulações são estimativas");
  await expect(page.getByTestId("semaforo")).toBeVisible();
  await expect(page.getByText("Estes são dados de exemplo")).toBeVisible();
});

test("cadastrar pessoa → ver diagnóstico → ver cenário no simulador", async ({ page }) => {
  await page.goto("/situacao");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Começar do zero" }).click();
  await expect(page.getByText("Nenhuma pessoa cadastrada")).toBeVisible();

  await page.getByRole("button", { name: "+ Adicionar pessoa" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Ana");
  await page.getByLabel("Data de nascimento").fill("1990-05-10");
  await page.getByLabel("Situação de trabalho").selectOption("clt");
  await page.getByLabel("Salário bruto por mês").fill("3000");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ana" })).toBeVisible();

  await page.goto("/diagnostico");
  await expect(page.getByTestId("semaforo")).toContainText("Pronto para pedir crédito");

  await page.goto("/simulador");
  await expect(page.getByTestId("cenario")).toHaveCount(1);
  await expect(page.getByTestId("preco-maximo")).toContainText("R$");

  await page.goto("/situacao/historico");
  await expect(page.getByText("Adicionou Ana")).toBeVisible();
});
