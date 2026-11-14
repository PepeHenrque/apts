// Service worker simples: "rede primeiro, cache se estiver sem internet".
// As telas já visitadas abrem mesmo offline (os dados ficam no próprio aparelho).
const CACHE = "apts-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      })
      .catch(() =>
        caches
          .match(pedido)
          .then((r) => r || (pedido.mode === "navigate" ? caches.match("/") : undefined)),
      ),
  );
});
