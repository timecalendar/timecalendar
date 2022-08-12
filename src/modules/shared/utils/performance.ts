import prettyHrtime from "pretty-hrtime"

interface PerfValue {
  startAt: [number, number]
  diff: [number, number] | null
}

interface PerfInfo {
  name: string
  time: number
  words: string
  preciseWords: string
  verboseWords: string
}

interface PerfLogItem {
  action: "start" | "stop" | "log"
  name: string
  diff: [number, number]
}

export class Perf {
  namedPerformances: Record<string, PerfValue> = {}

  defaultName = "default"

  logEnabled = true

  startAt: [number, number]

  perfLog: PerfLogItem[] = []

  constructor(private enabled: boolean = true) {
    this.startAt = process.hrtime()
  }

  log(name: string = this.defaultName) {
    this.perfLog.push({
      action: "log",
      name,
      diff: process.hrtime(this.startAt),
    })
  }

  start(name: string = this.defaultName) {
    this.namedPerformances[name] = {
      startAt: process.hrtime(),
      diff: null,
    }

    this.perfLog.push({
      action: "start",
      name,
      diff: process.hrtime(this.startAt),
    })
  }

  stop(name: string = this.defaultName): PerfInfo {
    if (!this.enabled) throw new Error("Perf is disabled")

    const startAt =
      this.namedPerformances[name] && this.namedPerformances[name].startAt
    if (!startAt) throw new Error(`Namespace: ${name} doesn't exist`)
    const diff = process.hrtime(startAt)
    this.namedPerformances[name].diff = diff

    this.perfLog.push({
      action: "stop",
      name,
      diff: process.hrtime(this.startAt),
    })

    return this.infoFromDiff(name, diff)
  }

  private infoFromDiff(name: string, diff: [number, number]): PerfInfo {
    const time = diff[0] * 1e3 + diff[1] * 1e-6
    const words = prettyHrtime(diff)
    const preciseWords = prettyHrtime(diff, { precise: true })
    const verboseWords = prettyHrtime(diff, { verbose: true })

    return {
      name,
      time,
      words,
      preciseWords,
      verboseWords,
    }
  }

  all() {
    return Object.entries(this.namedPerformances).map(([name, value]) => {
      return {
        name,
        info: value.diff ? this.infoFromDiff(name, value.diff) : null,
      }
    })
  }

  info(name: string = this.defaultName) {
    const perf = this.namedPerformances[name]
    if (!perf) throw new Error(`Namespace: ${name} doesn't exist`)
    if (!perf.diff) throw new Error(`Namespace: ${name} is not stopped`)

    return this.infoFromDiff(name, perf.diff)
  }

  getLog() {
    const log = this.perfLog
      .filter((item) => item.name !== "default")
      .map((item) => {
        const info = this.infoFromDiff(item.name, item.diff)

        return `${item.name}${
          item.action !== "log" ? `-${item.action}` : ""
        }:${Math.round(info.time)}`
      })
      .join(",")

    const tasks = this.all().map(
      ({ name, info }) => `${name}:${info ? Math.round(info.time) : "x"}`,
    )

    return `${log};${tasks}`
  }
}
