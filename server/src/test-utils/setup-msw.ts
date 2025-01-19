import { RequestHandler } from "msw/lib/core/handlers/RequestHandler"
import { setupServer } from "msw/node"

export function setupMsw(...handlers: RequestHandler[]) {
  const server = setupServer(...handlers)

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  return server
}
