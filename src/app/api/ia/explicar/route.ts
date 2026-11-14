/**
 * POST /api/ia/explicar  { situação anonimizada } → explicação em linguagem simples.
 * O corpo é validado por Zod: só números e categorias, nada de nomes (rótulos "Pessoa 1"…).
 */
import { NextResponse, type NextRequest } from "next/server";
import { cabecalhosCors } from "@/lib/api";
import { esquemaSituacaoAnonima, promptExplicar } from "@/lib/ia/anonimizar";
import { chamarGemini, ErroCotaIA, iaConfigurada } from "@/lib/ia/gemini";
import { criarLimitador, ipDoPedido } from "@/lib/ia/limitador";

export const dynamic = "force-dynamic";

const limitador = criarLimitador(5, 10 * 60_000);

export async function POST(request: NextRequest) {
  const cors = cabecalhosCors(request.headers.get("origin"));
  const responder = (corpo: object, status = 200) =>
    NextResponse.json(corpo, { status, headers: cors });

  if (!iaConfigurada()) return responder({ erro: "IA não configurada." }, 503);
  if (!limitador.permitir(ipDoPedido(request.headers))) {
    return responder({ erro: "Muitos pedidos seguidos. Tente daqui a alguns minutos." }, 429);
  }
  const situacao = esquemaSituacaoAnonima.safeParse(await request.json().catch(() => null));
  if (!situacao.success) return responder({ erro: "Dados inválidos." }, 400);

  try {
    const texto = await chamarGemini({ prompt: promptExplicar(situacao.data) });
    return responder({ texto: texto.trim().slice(0, 3000) });
  } catch (e) {
    if (e instanceof ErroCotaIA) {
      return responder({ erro: "Limite diário da IA atingido. Tente amanhã." }, 429);
    }
    return responder({ erro: "A IA não respondeu agora. Tente mais tarde." }, 502);
  }
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: cabecalhosCors(request.headers.get("origin")),
  });
}
