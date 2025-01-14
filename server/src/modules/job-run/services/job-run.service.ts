import { Injectable } from "@nestjs/common"
import { K8S_POD_NAME } from "config/constants"
import { JobRunContext } from "modules/job-run/models/job-run-context.model"
import { RunParams } from "modules/job-run/models/job-run-params.model"
import { Perf } from "modules/shared/utils/performance"
import { createLogger, transports } from "winston"

@Injectable()
export class JobRunService {
  createLogger() {
    return createLogger({
      level: "info",
      transports: [new transports.Console()],
    })
  }

  async run<T>(runParams: RunParams<T>) {
    const { handler, progress } = runParams

    const logger = this.createLogger()

    const context: JobRunContext<T> = {
      params: runParams,
      logger,
      progress:
        progress ??
        (async () => {
          /* no-op */
        }),
    }

    const perf = new Perf()
    perf.start()

    try {
      this.logStart(context)
      const rep = await handler(context)
      const res = perf.stop()

      this.logEnd(context, res.time)
      return rep
    } catch (err) {
      const res = perf.stop()
      const error = {
        message: err?.message,
        error: `${err}`,
      }

      this.logError(context, res.time)
      logger.error(error)
    }
  }

  logStart<T>(context: JobRunContext<T>) {
    context.logger.info(
      `Job ${context.params.name} started${
        K8S_POD_NAME ? ` on pod ${K8S_POD_NAME}` : ""
      }`,
    )
  }

  logEnd<T>(context: JobRunContext<T>, time: number) {
    context.logger.info(`Job ${context.params.name} done in ${time}ms`)
  }

  logError<T>(context: JobRunContext<T>, time: number) {
    context.logger.error(`Job ${context.params.name} failed in ${time}ms`)
  }
}
