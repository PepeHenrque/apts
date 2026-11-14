import { BotaoLink, EstadoVazio } from "@/components/ui";

export default function NaoEncontrada() {
  return (
    <div className="py-8">
      <EstadoVazio titulo="Página não encontrada">Talvez o endereço esteja errado.</EstadoVazio>
      <BotaoLink href="/" className="mt-4 w-full">
        Voltar ao início
      </BotaoLink>
    </div>
  );
}
