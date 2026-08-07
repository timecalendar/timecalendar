import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { ExpressAdapter } from "@bull-board/express"
import { getQueueToken } from "@nestjs/bullmq"
import { NestExpressApplication } from "@nestjs/platform-express"
import { Queue } from "bullmq"
import { API_TOKEN, API_USERNAME } from "config/constants"
import { ALL_QUEUE_NAMES } from "config/queues"
import basicAuth from "express-basic-auth"

const bullBoardAdapter = (app: NestExpressApplication) => {
  const serverAdapter = new ExpressAdapter()

  // Reuses the Queue instances SharedQueueModule registered on the shared Bull
  // root connection — no extra Redis clients.
  createBullBoard({
    queues: ALL_QUEUE_NAMES.map(
      (name) =>
        new BullMQAdapter(
          app.get<Queue>(getQueueToken(name), { strict: false }),
        ),
    ),
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
