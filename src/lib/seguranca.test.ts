import { describe, expect, it } from "vitest";
import { linkSeguro } from "./seguranca";

describe("linkSeguro", () => {
  it("aceita http e https", () => {
    expect(linkSeguro("https://www.olx.com.br/anuncio/1")).toBe("https://www.olx.com.br/anuncio/1");
    expect(linkSeguro(" http://exemplo.com ")).toBe("http://exemplo.com/");
  });

  it("bloqueia javascript:, data: e textos que não são link", () => {
    expect(linkSeguro("javascript:alert(1)")).toBeNull();
    expect(linkSeguro("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(linkSeguro("www.exemplo.com")).toBeNull();
    expect(linkSeguro("")).toBeNull();
    expect(linkSeguro(undefined)).toBeNull();
  });
});
