import { test } from "@playwright/test";

// Capturas de tela de todas as telas principais em 3 larguras (celular, tablet, computador).
// Salvas em capturas/<largura>/ e publicadas como artefato "capturas-telas" no CI.
const TELAS = [
  ["inicio", "/"],
  ["situacao", "/situacao"],
  ["recusas", "/situacao/recusas"],
  ["diagnostico", "/diagnostico"],
  ["simulador", "/simulador"],
  ["imoveis", "/imoveis"],
  ["busca", "/busca"],
  ["encontrados", "/encontrados"],
  ["como-usar", "/como-usar"],
  ["guias", "/guias"],
  ["repasse", "/repasse"],
  ["emprestimo", "/emprestimo"],
  ["mais", "/mais"],
  ["familia", "/familia"],
] as const;
const LARGURAS = [390, 768, 1440] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("apts:quem", "Teste");
    window.localStorage.setItem("apts:tour:v1", "visto");
  });
});

for (const largura of LARGURAS) {
  test(`capturas ${largura}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: largura, height: largura < 700 ? 844 : 900 });
    for (const [nome, caminho] of TELAS) {
      await page.goto(caminho);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `capturas/${largura}/${nome}.png`, fullPage: true });
    }
  });
}
