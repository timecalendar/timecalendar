import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http"
import { Attributes, Span } from "@opentelemetry/api"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import type { NodeSDKConfiguration } from "@opentelemetry/sdk-node"
import { classifyUpstreamDomain } from "./upstream-domain"

export const isMigrationReportRequest = (
  request: Pick<IncomingMessage, "url">,
) => /^\/v1\/migration-reports(?:[/?]|$)/i.test(request.url ?? "")

export const annotateOutgoingHttpSpan = (
  span: Pick<Span, "setAttribute">,
  request: Pick<ClientRequest, "host" | "protocol"> | RequestOptions,
) => {
  for (const [name, value] of Object.entries(
    sanitizedOutgoingHttpAttributes(request),
  )) {
    if (value !== undefined) span.setAttribute(name, value)
  }
}

export const sanitizedOutgoingHttpAttributes = (
  request: Pick<ClientRequest, "host" | "protocol"> | RequestOptions,
): Attributes => {
  const host = "hostname" in request ? request.hostname : request.host
  const protocol = request.protocol === "https:" ? "https:" : "http:"
  const upstream = classifyUpstreamDomain(`${protocol}//${host ?? ""}`)
  const safeUrl = `${protocol}//${upstream}/`

  return {
    // Override both legacy and stable HTTP semantic attributes before the span
    // starts. The instrumentation otherwise records the request-derived URL,
    // host, path, query, peer address, and user-agent by default.
    "http.url": safeUrl,
    "url.full": safeUrl,
    "http.target": "/",
    "url.path": "/",
    "url.query": "",
    "http.host": upstream,
    "net.peer.name": upstream,
    "net.peer.ip": "[redacted]",
    "server.address": upstream,
    "network.peer.address": "[redacted]",
    "http.user_agent": "[redacted]",
    "user_agent.original": "[redacted]",
    "peer.service": upstream,
    "upstream.domain": upstream,
  }
}

const isOutgoingHttpRequest = (
  request: ClientRequest | IncomingMessage,
): request is ClientRequest =>
  typeof (request as ClientRequest).getHeader === "function"

export const createNodeInstrumentations =
  (): NodeSDKConfiguration["instrumentations"] => [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-express": { enabled: false },
      // HTTP spans retain the bounded upstream. Lower-level connect spans expose
      // the original destination hostname and add no causal layer of their own.
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-http": {
        // Incoming span URLs/headers are attacker-controlled, including rejected reports.
        ignoreIncomingRequestHook: isMigrationReportRequest,
        startOutgoingSpanHook: sanitizedOutgoingHttpAttributes,
        requestHook: (span, request) => {
          if (isOutgoingHttpRequest(request)) {
            annotateOutgoingHttpSpan(span, request)
          }
        },
        applyCustomAttributesOnSpan: (span, request) => {
          if (isOutgoingHttpRequest(request)) {
            annotateOutgoingHttpSpan(span, request)
          }
        },
      },
    }),
  ]
