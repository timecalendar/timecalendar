import { createBullBoard } from "@bull-board/api"
import { BullAdapter } from "@bull-board/api/bullAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { NestExpressApplication } from "@nestjs/platform-express"
import { API_TOKEN, API_USERNAME } from "config/constants"
import basicAuth from "express-basic-auth"
import { DEFAULT_QUEUE_NAME } from "modules/queue/queue.constants"

const bullBoardAdapter = (app: NestExpressApplication) => {
  const serverAdapter = new ExpressAdapter()

  createBullBoard({
    queues: [new BullAdapter(DEFAULT_QUEUE_NAME)],
    serverAdapter,
  })

  const basePath = "/admin/queues"
  serverAdapter.setBasePath(basePath)
  app.use(
    basePath,
    basicAuth({ users: { [API_USERNAME]: API_TOKEN }, challenge: true }),
    serverAdapter.getRouter(),
  )
}

export default bullBoardAdapter
