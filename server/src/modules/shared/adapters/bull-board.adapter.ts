import { createBullBoard } from "@bull-board/api"
import { BullAdapter } from "@bull-board/api/bullAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { getQueueToken } from "@nestjs/bull"
import { NestExpressApplication } from "@nestjs/platform-express"
import Bull from "bull"
import basicAuth from "express-basic-auth"
import { API_TOKEN, API_USERNAME } from "config/constants"
import { APP_QUEUES } from "modules/queue/queue.constants"

const bullBoardAdapter = (app: NestExpressApplication) => {
  const queues = APP_QUEUES.map((name) =>
    app.get<Bull.Queue>(getQueueToken(name)),
  )
  const serverAdapter = new ExpressAdapter()
  const bullAdapters = queues.map((queue) => new BullAdapter(queue))

  createBullBoard({
    queues: bullAdapters,
    serverAdapter,
  })

  const basePath = "/admin/queues"
  serverAdapter.setBasePath(basePath)
  app.use(
    basePath,
    basicAuth({
      users: { [API_USERNAME]: API_TOKEN },
      challenge: true,
    }),
    serverAdapter.getRouter(),
  )
}

export default bullBoardAdapter
