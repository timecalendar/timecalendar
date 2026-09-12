---
kind: decision
id: D03
status: approved
traces-to: [P05, P07, P08]
supersedes: []
---

# D03 — Retain the Expo 56 Hermes and New Architecture runtime

## Context and evidence

The manifest declares Expo 56, React Native 0.85.3, Reanimated 4.3.1 and Worklets 0.8.3. Local
Reanimated compatibility metadata includes that RN/Worklets pairing. Generated local Android and
iOS configuration select Hermes; generated files are observations, not source authority.
[Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) identifies RN 0.85 and the approved OS floors.
[Expo New Architecture guidance](https://docs.expo.dev/guides/new-architecture/) describes the
current architecture constraints; [Reanimated compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
requires the New Architecture for Reanimated 4.

## Options considered

- Retain the existing runtime: recommended (B-010).
- Downgrade for an old-architecture renderer: broad dependency/native regression surface with no
  measured calendar benefit.
- Add a second JS engine or runtime compatibility layer: doubles verification obligations without
  an approved product need.

## Decision

Require the repository's Expo 56/RN 0.85 Hermes/New Architecture baseline for the owned renderer.
Keep Android API 24 and iOS 16.4 compatibility gates. Verify exact resolved dependency versions
and clean generated runtime configuration before native acceptance. Upgrades remain separate
reviewed changes; this decision does not freeze patch versions forever.

## Tradeoffs and consequences

The renderer has no legacy-architecture support promise. Existing dependency presence proves
integration opportunity, not performance or security fitness. Native changes require a compatible
fingerprinted binary; simulator success cannot establish the physical-device floor.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
