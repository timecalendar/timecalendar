import { ATTR_SERVICE_INSTANCE_ID } from "@opentelemetry/semantic-conventions"
import { createTelemetryResource } from "./tracer"

describe("tracer resource", () => {
  it("distinguishes process identities for counter aggregation", () => {
    const first = createTelemetryResource("api-pod-a")
    const second = createTelemetryResource("api-pod-b")

    expect(first.attributes[ATTR_SERVICE_INSTANCE_ID]).toBe("api-pod-a")
    expect(second.attributes[ATTR_SERVICE_INSTANCE_ID]).toBe("api-pod-b")
    expect(first.attributes[ATTR_SERVICE_INSTANCE_ID]).not.toBe(
      second.attributes[ATTR_SERVICE_INSTANCE_ID],
    )
  })
})
