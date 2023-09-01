module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "prettier",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
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
}
