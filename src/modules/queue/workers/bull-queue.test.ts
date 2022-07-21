import { NestExpressApplication } from "@nestjs/platform-express"
import { BullQueue } from "modules/queue/workers/bull-queue"
import { RedisModule } from "modules/redis/redis.module"
import { RedisService } from "modules/redis/services/redis.service"
import { sleep } from "modules/shared/helpers/sleep"
import createTestApp from "test-utils/create-test-app"

describe("BullQueue", () => {
  let app: NestExpressApplication
  let redisService: RedisService
  let queue: BullQueue

  beforeAll(async () => {
    app = await createTestApp({ imports: [RedisModule] })
    redisService = app.get(RedisService)
  })

  beforeEach(() => {
    queue = new BullQueue(redisService.getRedisConfig())
  })

  it("creates a bull queue", async () => {
    const handler = jest.fn()
    await queue.init(handler)
  })

  afterEach(async () => {
    // sleep is needed to wait for the queue to connect to redis
    // before closing it, see this issue
    // https://github.com/facebook/jest/issues/12262
    await sleep(1000)
    await queue.close()
  })
})
