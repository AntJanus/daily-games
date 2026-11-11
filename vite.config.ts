import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative, so the build works at any GitHub Pages path without naming the repo.
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Dates render in local time; pin it so "Nov 4" means the same everywhere.
    env: { TZ: "America/Denver" },
  },
});
