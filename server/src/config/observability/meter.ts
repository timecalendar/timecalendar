import { metrics } from "@opentelemetry/api"

const meter = metrics.getMeter("default")

export default meter
