import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  resolve: {
    alias: {
      "react-konva": "react-konva/es/ReactKonva.js"
    }
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest-setup.ts"],
    css: false,
    server: {
      deps: {
        inline: ["konva", "react-konva"]
      }
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/index.tsx",
        "src/serviceWorker.ts",
        "src/reportWebVitals.ts"
      ],
      reporter: ["lcov", "text-summary"],
      thresholds: {
        statements: 80,
        branches: 80,
        lines: 80,
        functions: 80
      }
    }
  }
});
