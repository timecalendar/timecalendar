# Activity release physical-device pass

**For:** whoever runs the physical-device passes (physical hardware and assistive-technology
operation are unavailable on the development host).

## What I need

- [ ] On a supported iPhone, exercise the Activity unread badge, open/clear behavior, current-event
      details, cancelled entries, pull-to-refresh, stable tie ordering, and older-page loading.
- [ ] Repeat the same journey on an iPad in portrait and on a supported Android phone.
- [ ] With VoiceOver and TalkBack, traverse the Settings row, unread badge, grouped timeline,
      retry/empty states, refresh control, rows, and pagination state in meaningful order.
- [ ] Repeat at the largest supported text size and verify content remains readable and operable.
- [ ] On a representative low-end Android device, scroll and paginate the cached multi-page
      timeline without sustained jank, lost rows, duplicate rows, or reordered timestamp ties.

## Why

Native CI covers the shared automated flow, while physical hardware, assistive technologies,
large-text rendering, tablet portrait layout, and representative low-end scrolling require manual
observation.

## How to verify

Record the tested device/OS combinations and pass/fail result for every checkbox on the release
review. Any failure returns to implementation with reproduction steps and must be rechecked on the
corrected candidate.

## Blocks

Activity production readiness evidence. This checklist is non-blocking for repository merge and
does not authorize deployment, store submission, or runtime promotion.
