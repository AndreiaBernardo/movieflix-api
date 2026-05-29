import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],

    languageOptions: {
      globals: globals.node,
    },

    extends: [js.configs.recommended],

    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      indent: ["error", 2],
     
    },
  },

  ...tseslint.configs.recommended,
]);
