# Inbox — handoffs from the autonomous pipeline to Samuel

The `/ship` pipeline runs unattended. When it hits something it **physically cannot do** — or a
decision it shouldn't make alone — it drops a note here and keeps going on everything else.

## Convention

- One file per handoff: `YYYY-MM-DD-<slug>.md`.
- Each note states, in this order:
  1. **What I need** — the concrete action only you can take.
  2. **Why** — the constraint that blocked the agent (credentials, real device, store/Firebase
     console, manual screen-reader pass, an irreversible/ADR-worthy decision).
  3. **How to verify** — how you confirm it's done so the related task/PR can close.
  4. **Blocks** — which change/PR/roadmap step is waiting on it (or "nothing — informational").

## Why it exists (the rules behind it)

- Some foundation steps have irreducibly-human parts: **EAS / store credentials** (step 11),
  **real-device install & TestFlight/Play console**, **Firebase console arrival** (step 8 leftover),
  **manual VoiceOver/TalkBack passes** (DoD), and any **ADR-worthy fork** the planner wouldn't
  resolve unilaterally.
- The pipeline never stalls waiting on you: it inboxes the item, marks the task
  `- [ ] ... (HUMAN: see inbox/<file>)`, and finishes the rest. The reviewer treats inboxed tasks
  as expected, not as merge blockers.

Clear a note by doing the action and deleting the file (or moving it to a `done/` subfolder).
