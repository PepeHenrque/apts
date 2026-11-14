// Copia CLAUDE.md para GEMINI.md e AGENTS.md, para que qualquer IA leia o mesmo guia.
// O AGENTS.md mantém no topo o bloco gerenciado pelo Next.js (re-inserido pelo `next dev`).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const INICIO = "<!-- BEGIN:nextjs-agent-rules -->";
const FIM = "<!-- END:nextjs-agent-rules -->";

const guia = readFileSync("CLAUDE.md", "utf8");
writeFileSync("GEMINI.md", guia);

let blocoNext = "";
if (existsSync("AGENTS.md")) {
  const atual = readFileSync("AGENTS.md", "utf8");
  const i = atual.indexOf(INICIO);
  const f = atual.indexOf(FIM);
  if (i !== -1 && f !== -1) blocoNext = atual.slice(i, f + FIM.length) + "\n\n";
}
writeFileSync("AGENTS.md", blocoNext + guia);

console.log("GEMINI.md e AGENTS.md sincronizados com CLAUDE.md");
