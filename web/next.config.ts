import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // The web app consumes the `@timecalendar/api-client` workspace package,
  // which lives outside `web/` (in `../openapi/javascript`). Turbopack would
  // otherwise infer the workspace root from the nearest lockfile and refuse to
  // resolve modules outside it. Pin the root to the monorepo directory so the
  // api-client resolves both locally and in the Docker build.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
}

export default nextConfig
