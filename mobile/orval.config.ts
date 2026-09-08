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
        operations: {
          ExportGuideV1Controller_findCatalogue: {
            mutator: {
              path: "src/api/mutator.ts",
              name: "customFetchResponse",
            },
            fetch: {
              includeHttpResponseReturnType: true,
            },
          },
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
