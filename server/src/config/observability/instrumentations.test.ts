import {
  annotateOutgoingHttpSpan,
  sanitizedOutgoingHttpAttributes,
} from "./instrumentations"

describe("outgoing HTTP span sanitization", () => {
  it.each([
    ["ade.ensea.fr", "ensea.fr"],
    ["calendar.example.test", "custom"],
    ["127.0.0.1", "invalid"],
  ])("adds only the bounded upstream for %s", (host, expected) => {
    const setAttribute = jest.fn()
    annotateOutgoingHttpSpan({ setAttribute }, {
      host,
      protocol: "https:",
    } as never)
    expect(Object.fromEntries(setAttribute.mock.calls)).toMatchObject({
      "http.host": expected,
      "net.peer.name": expected,
      "server.address": expected,
      "peer.service": expected,
      "upstream.domain": expected,
    })
  })

  it("replaces every request-derived legacy and stable HTTP attribute", () => {
    const attributes = sanitizedOutgoingHttpAttributes({
      hostname: "private.example.test",
      path: "/calendar/student@example.test?token=top-secret",
      protocol: "https:",
      auth: "student:password",
      headers: { authorization: "Bearer top-secret", host: "raw-host.test" },
    })

    expect(attributes).toMatchObject({
      "http.url": "https://custom/",
      "url.full": "https://custom/",
      "http.target": "/",
      "url.path": "/",
      "url.query": "",
      "http.host": "custom",
      "net.peer.name": "custom",
      "net.peer.ip": "[redacted]",
      "server.address": "custom",
      "network.peer.address": "[redacted]",
      "http.user_agent": "[redacted]",
      "user_agent.original": "[redacted]",
      "peer.service": "custom",
      "upstream.domain": "custom",
    })
    expect(JSON.stringify(attributes)).not.toMatch(
      /private\.example|student|top-secret|raw-host|password/,
    )
  })
})
