# Phase 08 — AI assistant

> **Goal:** the assistant feature (webview + server-side AI).
>
> **Depends on:** template (Phase 02). **Modules:** `assistant`. Server: `@ai-sdk/openai` / `ai` (unchanged).

## Rough steps

1. **Webview surface** — `react-native-webview` hosting the assistant (replaces `webview_flutter`).
2. **Bridge** — pass identity/context (calendar tokens, locale) into the webview as the Flutter app does.
3. **Local-dev guardrails** — account for the known **"Network Error"** gotcha ([[local-dev-network-error]]: hosts / web `.env.local` / simulator cert trust). Document the RN equivalent so it doesn't burn a day.
4. **Insertion point** — insert the assistant at the deliberately explicit **Connect → manual-import edge**, without changing the preceding institution or programme screens (ADR [047](../../../docs/mobile/architecture-book/decisions/047-ephemeral-calendar-import-draft.md), [navigation.md](../../../docs/mobile/architecture-book/navigation.md)); [TIM-391](/TIM/issues/TIM-391) ([#323](https://github.com/timecalendar/timecalendar/pull/323), `a10ab396`) preserves this boundary, verified by the colocated Connect/manual-import tests under `mobile/src/features/onboarding/ui/`.

## Exit criteria

- Assistant loads and functions in release builds on both platforms; passes full DoD (a11y of the webview included).

## Risks & decisions

- Webview a11y and native-feel are weaker than native screens — acceptable for this surface, but note it.
- Decide later whether this stays a webview long-term or becomes a native RN chat surface (out of scope for parity).
</content>
