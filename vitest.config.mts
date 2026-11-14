import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes unitários rodam em ambiente Node (lógica pura, sem navegador).
// Testes E2E (Playwright) ficam em e2e/ e só rodam no CI.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/config/**"],
    },
  },
});
