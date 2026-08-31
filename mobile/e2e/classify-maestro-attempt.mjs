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
// An attempt is a *retryable startup failure* when its final app-restart epoch
// proved nothing about the app:
//   - no independent command failed before the final startup failure, AND
//   - no assertion command in the final epoch reached a terminal evaluated
//     state, AND
//   - every command in that epoch is a startup-phase command or a non-evaluated
//     assertion.
//
// An attempt with no recorded commands at all is the same shape: Maestro aborted
// during session creation, before it opened the flow. The caller handles that
// case (there is no file to read) and never invokes this script for it.
//
// Everything else is terminal. A completed assertion in an earlier, completed
// phase may precede an explicit restart boundary; a FAILED assertion or any
// other earlier FAILED command remains globally terminal. A FAILED
// `runFlowCommand` is not independent only while it is the still-live,
// lower-depth structural ancestor of the final startup command.
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

// These commands explicitly begin or advance an app lifecycle transition. The
// latest one at the failing command's depth starts the final restart epoch.
const RESTART_BOUNDARY_COMMANDS = new Set([
  "launchAppCommand",
  "stopAppCommand",
  "openLinkCommand",
])

// Maestro shapes each entry as { command: { <kind>: {…} }, metadata: {…} }.
// Nested `runFlow` commands are flattened into the same sequence-ordered list
// with a `depth` marker, so the last element is the last command Maestro
// reached at any depth.
const commandKind = (entry) => {
  const kinds = Object.keys(entry?.command ?? {})
  return kinds.length === 1 ? kinds[0] : undefined
}

const commandDepth = (entry) => {
  const depth = entry?.metadata?.depth
  return Number.isInteger(depth) && depth >= 0 ? depth : undefined
}

// Maestro propagates a nested child's failure onto its enclosing runFlow before
// serializing the child commands. That wrapper is not an independent verdict
// only while it remains structurally open around the final startup command.
// Returning to the wrapper's depth (or shallower) closes it; same-depth wrappers
// are siblings, not ancestors.
const isLiveFailedRunFlowAncestor = (commands, wrapperIndex, finalIndex) => {
  const wrapper = commands[wrapperIndex]
  const wrapperDepth = commandDepth(wrapper)
  const finalDepth = commandDepth(commands[finalIndex])

  if (
    commandKind(wrapper) !== "runFlowCommand" ||
    wrapper?.metadata?.status !== "FAILED"
  ) {
    return false
  }
  if (wrapperIndex >= finalIndex || wrapperDepth >= finalDepth) return false

  return commands
    .slice(wrapperIndex + 1, finalIndex)
    .every((entry) => commandDepth(entry) > wrapperDepth)
}

export const isRetryableStartupFailure = (commands) => {
  if (!Array.isArray(commands)) return false
  if (commands.length === 0) return true
  if (
    commands.some(
      (entry) =>
        commandKind(entry) === undefined ||
        commandDepth(entry) === undefined ||
        typeof entry?.metadata?.status !== "string",
    )
  ) {
    return false
  }

  const last = commands[commands.length - 1]
  const lastKind = commandKind(last)
  if (lastKind === undefined || !STARTUP_PHASE_COMMANDS.has(lastKind))
    return false

  // A later restart never erases an earlier application or interaction
  // failure. The final command is excluded because a FAILED startup command is
  // precisely the retryable transport shape this classifier recognizes. The
  // one structural exception is a FAILED runFlow wrapper that is still the
  // live lower-depth ancestor of that final command; its status is the child's
  // propagated failure, not an independent earlier verdict.
  const finalIndex = commands.length - 1
  if (
    commands
      .slice(0, -1)
      .some(
        (entry, index) =>
          entry?.metadata?.status === "FAILED" &&
          !isLiveFailedRunFlowAncestor(commands, index, finalIndex),
      )
  ) {
    return false
  }

  const failingDepth = commandDepth(last)
  let boundaryIndex = 0
  for (let index = commands.length - 1; index >= 0; index -= 1) {
    const entry = commands[index]
    if (
      commandDepth(entry) === failingDepth &&
      RESTART_BOUNDARY_COMMANDS.has(commandKind(entry))
    ) {
      boundaryIndex = index
      break
    }
  }

  const currentEpoch = commands.slice(boundaryIndex)
  const terminalEpochCommand = currentEpoch.find((entry) => {
    const kind = commandKind(entry)
    if (kind === undefined) return true
    if (isAssertionCommand(kind)) {
      return EVALUATED_STATUSES.has(entry?.metadata?.status)
    }
    return !STARTUP_PHASE_COMMANDS.has(kind)
  })
  return terminalEpochCommand === undefined
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
      `[classify-maestro-attempt] retryable startup failure: final restart epoch contains only startup commands (${describe(commands)})`,
    )
    return 0
  }

  console.error(
    `[classify-maestro-attempt] terminal: the attempt got past startup (${describe(commands)})`,
  )
  return 1
}

process.exitCode = main()
