# 060 — Compose platform-native lists behind chrome

## Context

Settings needs platform-owned form, list, row, selection, switch, and dialog behavior while
preserving shared preference meaning and Expo Router navigation. The thin Expo UI re-export from
ADR 010 cannot express one-scroll-owner pages or divergent iOS and Android selection journeys.

## Decision

`src/components/chrome/native-list.tsx` is a bounded composed-control exception. It privately
uses SwiftUI `Host`/`Form`/`Section` and Material `Host`/`LazyColumn`/`ListItem`, exports the closed
project-owned `NativeList*` contracts (host, section, row, switch, choice, alert, radio dialog,
floating action), and feeds every host the resolved app color scheme. Expo Router owns
headers and pushes; the native form or list is the page's only scroll and inset owner.

Features render the seam directly ([072](./072-native-list-seam.md)). Feature screens own
translated copy, routing intent, preference state, and persistence.

## Consequences and revisit condition

Jest proves contract wiring, platform selection, theme propagation, dialog dismissal, and scroll
ownership, but not native geometry, ripple, Dynamic Type, or assistive quality; those remain
owner-led device acceptance. Revisit only if stable Expo primitives can provide the same native
journeys with a smaller boundary without exposing platform APIs to features.
