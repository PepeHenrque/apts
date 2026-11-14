import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Verificação automática de acessibilidade (WCAG 2 A e AA) nas telas principais.
const TELAS = [
  "/",
  "/situacao",
  "/situacao/recusas",
  "/situacao/dinheiro",
  "/situacao/preferencias",
  "/diagnostico",
  "/simulador",
  "/imoveis",
  "/busca",
  "/guias",
  "/repasse",
  "/emprestimo",
  "/mais",
  "/familia",
  "/como-usar",
  "/encontrados",
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("apts:quem", "Teste");
    window.localStorage.setItem("apts:tour:v1", "visto");
  });
});

for (const tela of TELAS) {
  test(`acessibilidade: ${tela}`, async ({ page }) => {
    await page.goto(tela);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.getByText("Carregando…")).toHaveCount(0);
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const problemas = resultado.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(" | ")}`,
    );
    expect(problemas, problemas.join("\n")).toEqual([]);
  });
}
