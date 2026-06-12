# Phase 08 — AI assistant

> **Goal:** the assistant feature (webview + server-side AI).
>
> **Depends on:** template (Phase 02). **Modules:** `assistant`. Server: `@ai-sdk/openai` / `ai` (unchanged).

## Rough steps

1. **Webview surface** — `react-native-webview` hosting the assistant (replaces `webview_flutter`).
2. **Bridge** — pass identity/context (calendar tokens, locale) into the webview as the Flutter app does.
3. **Local-dev guardrails** — account for the known **"Network Error"** gotcha ([[local-dev-network-error]]: hosts / web `.env.local` / simulator cert trust). Document the RN equivalent so it doesn't burn a day.

## Exit criteria

- Assistant loads and functions in release builds on both platforms; passes full DoD (a11y of the webview included).

## Risks & decisions

- Webview a11y and native-feel are weaker than native screens — acceptable for this surface, but note it.
- Decide later whether this stays a webview long-term or becomes a native RN chat surface (out of scope for parity).
</content>
