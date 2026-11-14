import { BotaoLink, EstadoVazio, TituloPagina } from "@/components/ui";

export default function PaginaImoveis() {
  return (
    <>
      <TituloPagina>Imóveis</TituloPagina>
      <EstadoVazio titulo="Em construção">
        A lista de imóveis salvos, a busca guiada e o mapa chegam na próxima etapa.
      </EstadoVazio>
      <BotaoLink href="/simulador" className="mt-4 w-full">
        Ver quanto dá para comprar
      </BotaoLink>
    </>
  );
}
