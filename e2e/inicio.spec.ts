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

  await page.goto("/imoveis");
  await page.getByRole("button", { name: "+ Adicionar imóvel" }).click();
  await page.getByLabel("Cole aqui o texto do anúncio").fill("Apto 2 quartos, 45m², R$ 90.000");
  await page.getByRole("button", { name: "Preencher a partir do texto" }).click();
  await page.getByLabel("Nome do imóvel").fill("Apto barato");
  await page.getByRole("button", { name: "Salvar imóvel" }).click();
  await expect(page.getByRole("heading", { name: "Apto barato" })).toBeVisible();
  await expect(page.getByTestId("cor-orcamento")).toContainText("Cabe no orçamento");

  await page.getByRole("button", { name: "+ Adicionar imóvel" }).click();
  await page.getByLabel("Nome do imóvel").fill("Casa cara");
  await page.getByLabel("Preço", { exact: true }).fill("900000");
  await page.getByRole("button", { name: "Salvar imóvel" }).click();
  await expect(page.getByTestId("cor-orcamento")).toHaveCount(2);
  await expect(page.getByText("Não cabe no orçamento")).toBeVisible();

  await page.goto("/situacao/historico");
  await expect(page.getByText("Adicionou Ana")).toBeVisible();
  await expect(page.getByText('Salvou o imóvel "Apto barato"')).toBeVisible();
});

test("checklist marcado continua marcado depois de recarregar", async ({ page }) => {
  await page.goto("/guias");
  const item = page.getByLabel("RG e CPF (ou CNH) de cada comprador");
  await item.check();
  await page.reload();
  await expect(page.getByLabel("RG e CPF (ou CNH) de cada comprador")).toBeChecked();
});

test("manifesto do app instalável", async ({ request }) => {
  const resposta = await request.get("/manifest.webmanifest");
  expect(resposta.ok()).toBe(true);
  const manifesto = await resposta.json();
  expect(manifesto.short_name).toBe("apts");
  expect(manifesto.icons.length).toBeGreaterThanOrEqual(2);
});

test("sem Supabase configurado, a família funciona em modo só neste aparelho", async ({ page }) => {
  await page.goto("/familia");
  await expect(page.getByText("Modo só neste aparelho")).toBeVisible();
});
