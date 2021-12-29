import { Injectable, Type } from "@nestjs/common"
import { ENABLE_REDIS } from "src/config/constants"
import { BullQueue } from "./workers/bull-queue"
import { AppQueue } from "./workers/app-queue"
import { LocalQueue } from "./workers/local-queue"

@Injectable()
export class QueueService {
  private queue: AppQueue

  constructor() {
    const Queue: Type<AppQueue> = ENABLE_REDIS ? BullQueue : LocalQueue
    this.queue = new Queue()
  }
}
