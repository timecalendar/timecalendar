# 060 — Compose platform-native settings behind chrome

## Context

Settings needs platform-owned form, list, row, selection, switch, and dialog behavior while
preserving shared preference meaning and Expo Router navigation. The thin Expo UI re-export from
ADR 010 cannot express one-scroll-owner pages or divergent iOS and Android selection journeys.

## Decision

`src/components/chrome/native-settings.tsx` is a bounded composed-control exception. It privately
uses SwiftUI `Host`/`Form`/`Section` and Material `Host`/`LazyColumn`/`ListItem`, exports closed
project-owned row contracts, and feeds every host the resolved app color scheme. Expo Router owns
headers and pushes; the native form or list is the page's only scroll and inset owner.

`SettingsRow` and `SettingsSection` remain typed compatibility adapters for About and Environment.
Feature screens own translated copy, routing intent, preference state, and persistence.

## Consequences and revisit condition

Jest proves contract wiring, platform selection, theme propagation, dialog dismissal, and scroll
ownership, but not native geometry, ripple, Dynamic Type, or assistive quality; those remain
owner-led device acceptance. Revisit only if stable Expo primitives can provide the same native
journeys with a smaller boundary without exposing platform APIs to features.
