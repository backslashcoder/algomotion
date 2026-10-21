import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
  },
});
