import eslint from "@eslint/js"
import importPlugin from "eslint-plugin-import"
import prettierRecommended from "eslint-plugin-prettier/recommended"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "eslint.config.mjs"],
  },
  {
    // ESLint 9 flat config defaults this to "warn"; the legacy .eslintrc.js
    // left it off. Keep it off so the migration reproduces the previous
    // behaviour 1:1 (and `lint --fix` does not strip pre-existing
    // disable directives).
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // typescript-eslint 8's `recommended` preset is stricter than the v6
      // preset this config replaces. The three rules below are pinned to
      // their v6-equivalent behaviour so the migration reproduces the
      // previous ruleset 1:1; adopting the stricter defaults is a separate
      // follow-up (see openspec change `server-dependency-upgrade`).
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
      "import/no-unresolved": "off",
      "no-restricted-imports": ["error", { patterns: ["../*"] }],
      "prefer-template": "error",
      "import/named": "off",
      "import/order": [
        "error",
        {
          pathGroups: [
            {
              pattern: "modules/**",
              group: "parent",
              position: "before",
            },
          ],
        },
      ],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
)
