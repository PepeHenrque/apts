/** GET /api/ia/status → { disponivel } — o botão de IA só aparece se a chave estiver configurada. */
import { NextResponse, type NextRequest } from "next/server";
import { cabecalhosCors } from "@/lib/api";
import { iaConfigurada } from "@/lib/ia/gemini";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return NextResponse.json(
    { disponivel: iaConfigurada() },
    { headers: cabecalhosCors(request.headers.get("origin")) },
  );
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: cabecalhosCors(request.headers.get("origin")),
  });
}
