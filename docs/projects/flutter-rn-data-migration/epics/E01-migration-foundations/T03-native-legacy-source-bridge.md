---
kind: ticket
id: T03
epic: E01
status: planned
traces-to: [P01, P04, D01]
depends-on: []
size: M
confidence: medium
---

# T03 — Read legacy sources through a bounded native bridge

## Outcome

Eligible production builds can read legacy document bytes/metadata and each allowlisted native
preference through a narrow typed seam on iOS and Android; development builds cannot discover them.

## Scope

Implement the local Expo module/config plugin contract for chunked file reads, iOS UserDefaults,
Android legacy XML preferences, absence/type/error classification, identity gating, and native seam
tests. Record the lasting native boundary in architecture guidance.

## Non-goals

No JSONL replay, target writes, preference coercion, source deletion, store submission, or claim of
signed-device proof.

## Definition of done

Both native implementations match one TypeScript contract, reject wrong identities, expose no raw
values to logging, classify every preference independently, and pass automated native/JS seam tests.

## Acceptance and verification

Run targeted native module and Jest seam tests plus mobile TypeScript/lint/coverage. Verify generated
native projects/config as required. T08, not this ticket, supplies physical path/update evidence.

## Likely work sites and reading

`mobile/modules/` or the repository's current local Expo-module location, `mobile/app.config.ts`,
Flutter platform projects, the technical source contract, and Architecture Book native/EAS/storage
guidance.

## Size and confidence drivers

M: bounded API but crosses Swift, Kotlin, CNG, and TypeScript. Medium confidence until the module is
compiled on both platforms and physical paths are observed.

## QA and sensitive surfaces

Application identity, native/store configuration, local tokens, and private documents are
sensitive. Never log values or test with real student data.
