import { defineConfig } from "orval"

export default defineConfig({
  timecalendar: {
    input: "../openapi/openapi.json",
    output: {
      target: "src/api/generated",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "src/api/mutator.ts",
          name: "customFetch",
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
})
