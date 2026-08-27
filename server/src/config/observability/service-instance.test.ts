import {
  resolveServiceInstanceId,
  UNKNOWN_SERVICE_INSTANCE_ID,
} from "./service-instance"

describe("resolveServiceInstanceId", () => {
  it.each([
    [
      "timecalendar-server-6d7c9b8f4f-x2k9p",
      "timecalendar-server-6d7c9b8f4f-x2k9p",
    ],
    ["pod_01.example", "pod_01.example"],
    [undefined, UNKNOWN_SERVICE_INSTANCE_ID],
    ["", UNKNOWN_SERVICE_INSTANCE_ID],
    ["a".repeat(254), UNKNOWN_SERVICE_INSTANCE_ID],
    ["pod/name", UNKNOWN_SERVICE_INSTANCE_ID],
    ["pod name", UNKNOWN_SERVICE_INSTANCE_ID],
  ])("resolves %p to %p", (hostname, expected) => {
    expect(resolveServiceInstanceId(hostname)).toBe(expected)
  })
})
