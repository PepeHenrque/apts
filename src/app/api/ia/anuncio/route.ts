/**
 * POST /api/ia/anuncio  { texto } → campos do imóvel extraídos pelo Gemini (o usuário revisa).
 * Envia ao Gemini SOMENTE o texto do anúncio (com CPF/e-mail removidos por precaução).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { cabecalhosCors } from "@/lib/api";
import { ESQUEMA_RESPOSTA_ANUNCIO, lerDadosAnuncioIA, promptAnuncio } from "@/lib/ia/anuncio";
import { chamarGemini, ErroCotaIA, iaConfigurada, limparTextoParaIA } from "@/lib/ia/gemini";
import { criarLimitador, ipDoPedido } from "@/lib/ia/limitador";

export const dynamic = "force-dynamic";

const esquemaPedido = z.object({ texto: z.string().trim().min(10).max(5000) });
const porMinutos = criarLimitador(8, 10 * 60_000);
const porDia = criarLimitador(40, 24 * 60 * 60_000);

export async function POST(request: NextRequest) {
  const cors = cabecalhosCors(request.headers.get("origin"));
  const responder = (corpo: object, status = 200) =>
    NextResponse.json(corpo, { status, headers: cors });

  if (!iaConfigurada()) return responder({ erro: "IA não configurada." }, 503);

  const ip = ipDoPedido(request.headers);
  if (!porMinutos.permitir(ip) || !porDia.permitir(ip)) {
    return responder(
      { erro: "Muitos pedidos seguidos. Espere um pouco ou preencha manualmente." },
      429,
    );
  }

  const pedido = esquemaPedido.safeParse(await request.json().catch(() => null));
  if (!pedido.success) {
    return responder({ erro: "Cole um texto de anúncio (de 10 a 5000 letras)." }, 400);
  }

  try {
    const resposta = await chamarGemini({
      prompt: promptAnuncio(limparTextoParaIA(pedido.data.texto)),
      json: true,
      esquemaResposta: ESQUEMA_RESPOSTA_ANUNCIO,
    });
    const dados = lerDadosAnuncioIA(resposta);
    if (!dados)
      return responder({ erro: "A IA não conseguiu ler este anúncio. Preencha manualmente." }, 502);
    return responder({ dados });
  } catch (e) {
    if (e instanceof ErroCotaIA) {
      return responder({ erro: "Limite diário da IA atingido. Preencha manualmente." }, 429);
    }
    return responder({ erro: "A IA não respondeu agora. Preencha manualmente." }, 502);
  }
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: cabecalhosCors(request.headers.get("origin")),
  });
}
