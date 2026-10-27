import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL(".", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // Runs against local Supabase (`npx supabase start` + `db reset` first).
        resolve: { alias },
        test: {
          name: "rls",
          include: ["tests/rls/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/rls/setup.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
