---
kind: decision
id: D01
status: approved
traces-to: [P01, P02, P03]
supersedes: []
---

# D01 — Platform-owned settings presentation

## Context and evidence

Universal menu pickers and custom shared rows do not meet the owner's explicit pixel-perfect
native settings target. Installed Expo UI exposes SwiftUI forms and choices plus Compose
rows and radio dialogs. Expo Router exposes native routes, sheets, and iOS toolbar search.

## Options considered

Keep the universal menu controls; draw custom cross-platform replicas; or compose actual
platform primitives behind the existing chrome boundary. Native composition is selected.

## Decision

Share preference meaning and persistence, and compose platform-specific native screens.
iOS uses grouped forms, inline theme choices, pushed checkmarked language/frequency/day
lists, and a native sheet for custom days. Android uses Material settings rows and radio
dialogs, with a numeric-entry dialog for custom days. Native search adapts by platform and
OS version. Keep Expo Router as the navigation owner and one scroll owner per page.
The existing custom iOS text-entry overlay is not the custom-days presentation.

## Tradeoffs and consequences

More platform composition is intentional. The chrome boundary contains API churn. Existing
native theme primitives receive the resolved app scheme rather than being reskinned. Device
inspection remains necessary; available APIs do not establish pixel accuracy.

## Approval

Project owner, Codex conversation, 2026-09-21: “what we want to build is a pixel perfection
first, native filling setting screen. Adapted to both Android and iOS patterns.” The owner
answered “Perfect” to the frequency/day preset and custom-editor flows; selected “One choice
list: Use device language / Français / English”; and answered “6. Ok.” to the native
presentation/Router/scroll-owner direction. These approvals cover this presentation decision.
