import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  globalIgnores(["dist", "src/routeTree.gen.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowExportNames: ["Route"] }],
    },
  },
  {
    // Route files are framework structure, not regular components.
    // TanStack Router intentionally co-locates Route config with components.
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  prettierConfig,
]);
