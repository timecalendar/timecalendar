import { classifyUpstreamDomain } from "./upstream-domain"

describe("classifyUpstreamDomain", () => {
  it.each([
    ["https://ensea.fr/feed", "ensea.fr"],
    ["ade.ensea.fr:8080", "ensea.fr"],
    ["HTTPS://ADE.UNIV-ROUEN.FR.:8443/feed", "univ-rouen.fr"],
    ["https://ensea.fr.example.test/feed", "custom"],
    ["https://notensea.fr/feed", "custom"],
    ["https://calendar.example.test/feed", "custom"],
    ["https://user:secret@ensea.fr/feed", "invalid"],
    ["ftp://ensea.fr/feed", "invalid"],
    ["not a host", "invalid"],
    ["http://localhost/feed", "invalid"],
    ["http://127.0.0.1/feed", "invalid"],
    ["http://10.2.3.4/feed", "invalid"],
    ["http://169.254.169.254/feed", "invalid"],
    ["http://[::1]/feed", "invalid"],
  ])("classifies %s as %s", (input, expected) => {
    expect(classifyUpstreamDomain(input)).toBe(expected)
  })
})
