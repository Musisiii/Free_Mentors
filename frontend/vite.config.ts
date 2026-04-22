/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:8000";

  return {
    server: {
      host: true,
      port: 5173,
      allowedHosts: true,
      proxy: {
        "/graphql": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.d.ts",
          "src/main.tsx",
          "src/vite-env.d.ts",
          "src/test/**",
          "src/components/ui/**",
          "src/types/**",
          "src/lib/queries.ts",
          "src/lib/mutations.ts",
        ],
        thresholds: {
          lines: 60,
          functions: 40,
          branches: 50,
          statements: 60,
        },
      },
    },
  };
});
