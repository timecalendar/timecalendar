import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import prettierRecommended from "eslint-plugin-prettier/recommended"

// eslint-config-next v16 ships native flat configs. `core-web-vitals` already
// bundles the base Next rules, the TypeScript config and the default ignores,
// so no `@eslint/eslintrc` FlatCompat shim is needed anymore.
const eslintConfig = [
  ...nextCoreWebVitals,
  prettierRecommended,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    // The `@typescript-eslint` plugin is only registered for TypeScript files,
    // so this rule override must be scoped to them too.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
]

export default eslintConfig
