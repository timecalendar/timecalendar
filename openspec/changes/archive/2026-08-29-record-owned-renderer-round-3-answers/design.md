## Context

Round 3 began from a checked baseline of 280 questionnaire rows: 87 `CONFIRMED_IN`, 13
`CONFIRMED_OUT`, five `NEEDS_RESEARCH`, and 175 `UNANSWERED`. The question set groups 133 unique
unanswered keys into 12 owner-facing topics, but a grouped question does not permit blanket status
changes: each row must be supported by the owner's actual words or remain explicitly unresolved.

The authoritative answer inputs are the owner's
[free-form response](/TIM/issues/TIM-267#comment-266868c3-ff11-441e-8c13-32362aef1aa5), the
[row-level interpretation](/TIM/issues/TIM-267#comment-bb1aca00-d72e-4fa8-9b0b-1a981d21928f),
and answered interaction `ef6f4c48-a37f-442a-a376-ffe625c1c8c1`. The interaction fixes eight
previously ambiguous choices:

- `round3_05_mid_swipe=keep_until_settle`;
- `round3_07_zero_timed=instant_marker`;
- `round3_07_invalid_range=skip_bad_only`;
- `round3_07_continuation=show_cue`;
- `round3_07_back_to_back=not_overlap`;
- `round3_07_overlap_columns=equal_columns`;
- `round3_07_tie_order=stable_order`; and
- `round3_07_relayout=keep_last_complete`.

The discovery documents are not a functional specification. They must continue to distinguish
product decisions from repository observations, factual research, technical design, and eventual
production-release policy.

## Goals / Non-Goals

**Goals:**

- Preserve the owner's exact Round 3 meaning at the row level.
- Make all status totals and remaining-key lists mechanically agree with the rows.
- Turn the Round 3 artifact from proposed questions into a durable question-and-answer record.
- State what remains unresolved without creating another owner question.

**Non-Goals:**

- Create or authorize `03-functional-specification.md` or any later discovery artifact.
- Choose renderer architecture, APIs, algorithms, thresholds, dependencies, or an implementation
  plan.
- Implement renderer code, rollout machinery, production-data access, or another owner round.
- Change the Architecture Book, ADRs, native configuration, or any other sensitive surface.

## Decisions

## Decision 1 — answer evidence has an explicit precedence

The structured interaction is authoritative for its eight exact choices. The owner's free-form
answer and the Founding Engineer's narrow interpretation govern the remaining topics. Existing
recommendation prose supplies context only where the owner accepted it; copied recommendation text
must not restore a choice the owner corrected.

In particular, the record must not reintroduce the rejected twelve-month navigation horizon,
cancelled-event display in this iteration, Calendar refresh, calendar haptics, skeleton loading,
or any pre-production rollback, calendar-kit fallback, or dual renderer.

The alternative of treating every recommendation as accepted wholesale is rejected because several
answers deliberately replace only part of a recommendation. The alternative of paraphrasing only
at summary level is rejected because the questionnaire is the row-level source of truth.

## Decision 2 — statuses describe the answer, not implementation confidence

Each touched key is assessed independently:

- use `CONFIRMED_IN` for an explicitly required first-delivery behavior;
- use `CONFIRMED_OUT` for an explicitly excluded first-delivery behavior, while preserving a stated
  future possibility in the answer text;
- use `DEFERRED` only when the owner deliberately moved a product decision later, and name its
  revisit trigger;
- use `NEEDS_RESEARCH` for bounded factual or technical work such as measured density limits; and
- retain `UNANSWERED` where the response does not actually settle the row.

A question's grouped key list is an audit set, not permission to manufacture decisions. Conversely,
one compound answer must be copied to every row it directly settles, rather than being recorded on
only the first convenient row.

## Decision 3 — preserve these 12 topic meanings and corrections

1. **Reuse/publication:** record a clean, reusable internal TimeCalendar Lego piece that the team is
   proud of; do not require a public npm package in the first delivery. Do not invent a public API,
   semantic-versioning, licensing, example-app, or contribution promise merely because future
   extraction remains possible.
2. **Devices and controls:** phone and tablet portrait are first-class. Tablet landscape may be
   allowed without bespoke landscape polish, but the current portrait-only native contract remains
   unchanged by this documentation change. Ordinary keyboard/computer control is deferred;
   complete accessibility control remains first-class.
3. **Surface boundary:** the recommendation is accepted: ordinary university and personal events
   use owned day/week rendering, while month/custom-day modes, renderer-owned search/filtering,
   side-by-side comparison, mini rendering, and Home reuse are not in this delivery. Agenda remains
   independent.
4. **Direct manipulation:** editing, grid creation, long-press, drag, resize, rescheduling,
   recurrence editing, and per-event/per-calendar timezone display are out of the first delivery,
   not forbidden forever. The record must preserve future feasibility without choosing an
   architecture now.
5. **Paging:** accept whole day/week pages, one page per swipe, platform-native physics, settled
   title changes, reduced-motion-aware Today/deep-link movement, and preservation of mode/zoom.
   There is no resting partial week; while a finger holds the transition, the old title and selected
   day remain until settle. Reject a twelve-month navigation limit: dates years away must be
   navigable when synchronized data exists.
6. **Grid and zoom:** accept the recommended full-day grid, pinned labels/headers, zoom-dependent
   divisions, continuous pinch, visible non-pinch controls, locale/time-format behavior, Gregorian
   launch behavior, and clock-position continuity. Measured min/max zoom values remain technical
   work rather than an owner-supplied number.
7. **Unusual/crowded events:** hide cancelled events in this iteration while keeping future display
   possible. Apply all seven structured choices: instant marker, skip only an invalid event,
   continuation cue, back-to-back non-overlap, equal columns, stable order, and last-complete-frame
   replacement. The numeric crowding/aggregation threshold remains bounded agent-owned research.
8. **Tile content:** visually show event name and location; visual time is conveyed by grid
   position and time is always present in the accessibility label. Source color may be adjusted for
   acceptable active-theme contrast. Exact permitted ranges and the contrast algorithm remain later
   technical work, not a product choice.
9. **Operation/accessibility:** there is no Calendar refresh gesture or calendar haptic. Home keeps
   pull-to-refresh for now, with a possible later Settings action. Chronological accessibility order
   is focus/navigation on the same Calendar screen, not a separate destination. Preserve the rest
   of the accepted recommendation, including non-gesture controls and physical-device evidence.
10. **Visual/loading/error:** use a normal loading indicator, not a skeleton; preserve the rest of
    the accepted visual, stale-data, retry, and no-wrong-date recommendation.
11. **Live changes/recovery:** accept the recommendation to settle gestures before locale,
    timezone, theme, or text-size changes. Orientation and window-size behavior remain unanswered.
    Swap complete geometry atomically, isolate malformed rows, handle disappearing events
    accessibly, and retain an accessible failure representation.
12. **Evidence/acceptance/release:** accept the testing, privacy-safe evidence, acceptance, and
    engineering-review recommendation. This pre-production delivery has no rollback,
    calendar-kit fallback, or dual renderer. Eventual production rollout policy belongs to later
    release planning and must not be specified here.

## Decision 4 — summaries and counts are derived from the row table

The questionnaire table remains canonical. After editing rows, an executable consistency check
must parse every row, count each recognized status, derive the exact `UNANSWERED` keys in document
order, and compare those results with every summary/list in the questionnaire, README, evidence
summary, and Round 3 record. The check must also prove there are still exactly 280 unique row keys
and that no key was silently dropped or duplicated.

No hard-coded target count is used as a substitute for row fidelity. The expected number is whatever
the faithful row mapping produces; all prose must then report that same number and key set.

## Decision 5 — preserve the questions and append the answer record

`round-3-triage-and-owner-questions.md` remains useful evidence of what the owner was asked. Its
status and future-tense framing change from “proposed” to “answered,” and a concise keyed answer
section is added without deleting the original question/recommendation text. The README and evidence
summary link to that answer record and describe Round 3 as recorded, while still stating that
functional specification and architecture work are unauthorized.

## Risks / Trade-offs

- **A correction is hidden by copied recommendation prose** → search explicitly for every rejected
  phrase and review its surrounding status after the edit.
- **A grouped answer broadens owner intent** → apply Decision 2 per row and retain unresolved status
  rather than guessing.
- **Counts drift across four documents** → run the derived row/key consistency proof before commit.
- **A product answer becomes an architecture decision** → keep algorithms, numeric thresholds,
  native orientation changes, and rollout mechanics as later work.
- **Binding documentation is changed accidentally** → verify the diff is confined to the four
  discovery documents plus this OpenSpec change; Architecture Book work is explicitly N/A.

## Migration Plan

There is no runtime or data migration. The Applier updates the questionnaire first, derives the
summary values from it, then updates the three narrative documents and runs the consistency proof.

## Open Questions

No new owner input is requested by this change. Any row not directly settled by the recorded answers
remains visibly unresolved for later discovery; bounded research stays assigned to agents.
