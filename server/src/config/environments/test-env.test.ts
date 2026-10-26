import { developmentEnvVariables } from "config/environments/development"
import { testEnvVariables } from "config/environments/test"

describe("test environment", () => {
  it("serves public assets on the dev origin the dev-variant mobile client allow-lists for export guides", () => {
    expect(testEnvVariables.S3_PUBLIC_BUCKET_CLIENT_URL).toBe(
      developmentEnvVariables.S3_PUBLIC_BUCKET_CLIENT_URL,
    )
  })
})
