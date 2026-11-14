// Gera os ícones PNG do app (casa branca em fundo azul) sem dependências externas.
// Uso: node scripts/gerar-icones.mjs  → public/icones/*.png e src/app/apple-icon.png
import { mkdirSync, writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

const AZUL = [29, 78, 216, 255];
const BRANCO = [255, 255, 255, 255];

function png(tamanho, desenhar) {
  const linhas = Buffer.alloc((tamanho * 4 + 1) * tamanho);
  for (let y = 0; y < tamanho; y++) {
    linhas[y * (tamanho * 4 + 1)] = 0; // filtro "nenhum"
    for (let x = 0; x < tamanho; x++) {
      const cor = desenhar(x / tamanho, y / tamanho);
      linhas.set(cor, y * (tamanho * 4 + 1) + 1 + x * 4);
    }
  }
  const bloco = (tipo, dados) => {
    const tamanhoBuf = Buffer.alloc(4);
    tamanhoBuf.writeUInt32BE(dados.length);
    const tipoBuf = Buffer.from(tipo, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([tipoBuf, dados])) >>> 0);
    return Buffer.concat([tamanhoBuf, tipoBuf, dados, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(linhas)),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}

/** Casa centralizada; `escala` < 1 deixa margem (ícone "maskable" precisa de área segura). */
function casa(escala) {
  return (x, y) => {
    const cx = (x - 0.5) / escala + 0.5;
    const cy = (y - 0.5) / escala + 0.5;
    const telhado = cy >= 0.2 && cy <= 0.48 && Math.abs(cx - 0.5) <= (cy - 0.2) * 1.15;
    const corpo = cx >= 0.26 && cx <= 0.74 && cy >= 0.46 && cy <= 0.8;
    const porta = cx >= 0.44 && cx <= 0.56 && cy >= 0.6 && cy <= 0.8;
    return (telhado || corpo) && !porta ? BRANCO : AZUL;
  };
}

mkdirSync("public/icones", { recursive: true });
writeFileSync("public/icones/icone-192.png", png(192, casa(1)));
writeFileSync("public/icones/icone-512.png", png(512, casa(1)));
writeFileSync("public/icones/icone-maskable-512.png", png(512, casa(0.75)));
writeFileSync("src/app/apple-icon.png", png(180, casa(0.85)));
console.log("Ícones gerados.");
