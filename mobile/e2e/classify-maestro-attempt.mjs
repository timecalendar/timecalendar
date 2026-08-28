// classify-maestro-attempt.mjs — structural classifier for one Maestro attempt.
//
// ADR 038 decides whether a failed Maestro attempt may be retried. It used to
// decide that by matching stack-trace text, and carried three separate
// signatures for three observed iOS startup-transport failures. Each signature
// bought exactly one CI cycle before the next variant appeared — the last commit
// added before this one is literally "match the real iOS code-60 punctuation".
// Punctuation is not a contract. Maestro's own machine-readable per-flow
// `commands.json` is.
//
// An attempt is a *retryable startup failure* when it proved nothing about the
// app:
//   - no assertion command reached a terminal evaluated state, AND
//   - the last command Maestro recorded is one of the startup-phase commands
//     that bring the app up (variables, config, launch, stop, deep-link reopen).
//
// An attempt with no recorded commands at all is the same shape: Maestro aborted
// during session creation, before it opened the flow. The caller handles that
// case (there is no file to read) and never invokes this script for it.
//
// Everything else is terminal. In particular, an attempt that evaluated even one
// assertion is terminal no matter what else its output says.
//
// The bound, stated plainly rather than glossed: an app that deterministically
// fails to launch matches this shape too. It is still reported red — it exhausts
// the per-flow attempt budget and the harness exits non-zero. Retry costs
// attempts, never correctness.
//
// Usage: node classify-maestro-attempt.mjs <path/to/commands.json>
//   exit 0 — retryable startup failure
//   exit 1 — terminal failure (an unreadable or malformed record is terminal:
//            the classifier fails closed, like the rest of ADR 038)

import fs from "node:fs"

// Maestro records every assertion as `assertConditionCommand` — assertVisible,
// assertNotVisible and extendedWaitUntil all collapse into it — and
// `scrollUntilVisible`, which asserts visibility after scrolling. Matching the
// family by prefix means a future `assert*` command counts as evidence by
// default, which errs toward "terminal": the safe direction.
const isAssertionCommand = (kind) =>
  kind.startsWith("assert") || kind.startsWith("scrollUntilVisible")

// A command has been *evaluated* once it reaches a terminal state. RUNNING and
// PENDING mean Maestro died mid-command; SKIPPED means a `when:` guard declined
// it. None of those proves anything about the application.
const EVALUATED_STATUSES = new Set(["COMPLETED", "FAILED"])

// The commands that carry the app from a cold session to the point where the
// flow can begin asserting. These are exactly the phases the three retired
// stack-trace signatures covered: driver/session startup, the initial launch,
// and the deep-link reopen. `runFlowCommand` is included because a flow that
// died at a `runFlow` boundary has recorded nothing from inside it yet.
const STARTUP_PHASE_COMMANDS = new Set([
  "defineVariablesCommand",
  "applyConfigurationCommand",
  "launchAppCommand",
  "stopAppCommand",
  "openLinkCommand",
  "runFlowCommand",
])

// Maestro shapes each entry as { command: { <kind>: {…} }, metadata: {…} }.
// Nested `runFlow` commands are flattened into the same sequence-ordered list
// with a `depth` marker, so the last element is the last command Maestro
// reached at any depth.
const commandKind = (entry) => Object.keys(entry?.command ?? {})[0]

export const isRetryableStartupFailure = (commands) => {
  if (!Array.isArray(commands)) return false
  if (commands.length === 0) return true

  const evaluatedAssertion = commands.find((entry) => {
    const kind = commandKind(entry)
    return (
      kind !== undefined &&
      isAssertionCommand(kind) &&
      EVALUATED_STATUSES.has(entry?.metadata?.status)
    )
  })
  if (evaluatedAssertion !== undefined) return false

  const lastKind = commandKind(commands[commands.length - 1])
  return lastKind !== undefined && STARTUP_PHASE_COMMANDS.has(lastKind)
}

const describe = (commands) => {
  const last = commands.length === 0 ? "none" : commandKind(commands.at(-1))
  const status = commands.at(-1)?.metadata?.status ?? "none"
  return `${commands.length} command(s) recorded, last=${last} status=${status}`
}

const main = () => {
  const [commandsPath] = process.argv.slice(2)
  if (commandsPath === undefined) {
    console.error("usage: classify-maestro-attempt.mjs <commands.json>")
    return 1
  }

  let commands
  try {
    commands = JSON.parse(fs.readFileSync(commandsPath, "utf8"))
  } catch (error) {
    console.error(
      `[classify-maestro-attempt] terminal: cannot read ${commandsPath}: ${error.message}`,
    )
    return 1
  }

  if (!Array.isArray(commands)) {
    console.error(
      `[classify-maestro-attempt] terminal: ${commandsPath} is not a command list`,
    )
    return 1
  }

  if (isRetryableStartupFailure(commands)) {
    console.error(
      `[classify-maestro-attempt] retryable startup failure: no assertion was evaluated (${describe(commands)})`,
    )
    return 0
  }

  console.error(
    `[classify-maestro-attempt] terminal: the attempt got past startup (${describe(commands)})`,
  )
  return 1
}

process.exitCode = main()
