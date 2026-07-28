import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "html"],
    },
    exclude: ["tests/integration/**", "tests/e2e/**", "node_modules/**"],
  },
});
