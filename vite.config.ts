/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    // Enhedstests kører ALTID i demo-mode, uanset lokal .env
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "", VITE_BRAND_KEY: "autohuset-vest" },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
  },
});
