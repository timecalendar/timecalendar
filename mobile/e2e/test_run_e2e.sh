#!/usr/bin/env bash
#
# Focused proof of run_e2e.sh's ADR 038 retry classifier.
#
# The classifier is structural: it reads Maestro's own per-flow commands.json and
# retries only when the final explicit app-restart epoch contains startup-phase
# commands and no evaluated assertion, while any earlier FAILED command remains
# globally terminal. Every scenario below therefore drives the fake Maestro's
# *command record*, not its stack-trace text — the whole point of the rule is
# that stack-trace text no longer decides anything.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS="$SCRIPT_DIR/run_e2e.sh"
CLASSIFIER="$SCRIPT_DIR/classify-maestro-attempt.mjs"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/timecalendar-e2e-harness.XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  echo "[test_run_e2e] FAIL: $*" >&2
  exit 1
}

assert_count() {
  local expected="$1" pattern="$2" file="$3" actual
  actual="$(grep -c "$pattern" "$file" || true)"
  [ "$actual" -eq "$expected" ] || \
    fail "expected $expected occurrence(s) of '$pattern' in $file, got $actual"
}

make_fixture() {
  local scenario="$1"
  local fixture="$TEST_ROOT/$scenario"
  mkdir -p "$fixture/bin" "$fixture/flows" "$fixture/logs" "$fixture/state" "$fixture/debug"
  printf '%s\n' 'appId: test' '---' '- launchApp' > "$fixture/flows/alpha.yaml"
  printf '%s\n' 'appId: test' '---' '- launchApp' > "$fixture/flows/beta.yaml"

  cat > "$fixture/server" <<'SH'
#!/usr/bin/env bash
echo "$1" >> "$CALL_LOG"
SH
  chmod +x "$fixture/server"

  cat > "$fixture/bin/maestro" <<'SH'
#!/usr/bin/env bash
flow="$(basename "$2" .yaml)"
count_file="$STATE_DIR/$flow"
count=0
[ ! -f "$count_file" ] || count="$(cat "$count_file")"
count=$((count + 1))
echo "$count" > "$count_file"
echo "$flow:$count" >> "$CALL_LOG"

# Write the per-flow command record exactly where Maestro writes it:
# <debug root>/<run dir>/<flow>/commands.json. Each argument is "kind:status"
# or "kind:status:depth".
emit_commands() {
  local dir="$MAESTRO_DEBUG_ROOT/run-$flow-$count/$flow"
  mkdir -p "$dir"
  {
    echo '['
    local first=1 entry kind remainder status depth
    for entry in "$@"; do
      kind="${entry%%:*}"
      remainder="${entry#*:}"
      status="${remainder%%:*}"
      depth=0
      [ "$remainder" = "$status" ] || depth="${remainder##*:}"
      [ "$first" -eq 1 ] || echo ','
      first=0
      printf '{"command":{"%s":{}},"metadata":{"status":"%s","depth":%s}}' \
        "$kind" "$status" "$depth"
    done
    echo ']'
  } > "$dir/commands.json"
}

# The startup prologue every flow shares, up to and including the launch.
LAUNCH_PROLOGUE=(
  defineVariablesCommand:COMPLETED
  applyConfigurationCommand:COMPLETED
)

case "$SCENARIO" in
  pass)
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  session_never_opened_flow)
    # Maestro aborted inside session creation, before it opened the flow: there
    # is no per-flow record at all, and the output names no flow command.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      echo 'iOS driver not ready in time' >&2
      exit 42
    fi
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  launch_never_completed)
    # The captured iOS attempt-2 shape (run 33187454002, flow `about`): the
    # process died mid-launch and printed NO exception text anywhere. Only the
    # command record shows what happened.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:RUNNING
      exit 43
    fi
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  open_link_never_completed)
    # The deep-link reopen shape: launch and stop completed, the flow died in
    # openLink, and no assertion was ever evaluated.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED stopAppCommand:COMPLETED openLinkCommand:RUNNING
      exit 44
    fi
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  deterministic_launch_failure)
    # An app that never launches matches the startup shape on every attempt. The
    # documented bound: retry costs attempts, not correctness — the run still
    # ends red.
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:RUNNING
    exit 45
    ;;
  completed_assertion_before_restart)
    # The captured 12-command hidden-events shape from run 33200667041: the
    # nested import assertion completed at depth 1, then a new depth-0
    # stopApp/openLink lifecycle failed. The earlier completed phase must not
    # veto retrying the whole top-level flow in a fresh Maestro process.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      emit_commands \
        defineVariablesCommand:COMPLETED:0 \
        applyConfigurationCommand:COMPLETED:0 \
        runFlowCommand:COMPLETED:0 \
        applyConfigurationCommand:COMPLETED:1 \
        launchAppCommand:COMPLETED:1 \
        stopAppCommand:COMPLETED:1 \
        openLinkCommand:COMPLETED:1 \
        runFlowCommand:COMPLETED:1 \
        tapOnElement:WARNED:2 \
        assertConditionCommand:COMPLETED:1 \
        stopAppCommand:COMPLETED:0 \
        openLinkCommand:FAILED:0
      exit 46
    fi
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  failed_assertion_before_restart)
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED:1 assertConditionCommand:FAILED:1 \
        stopAppCommand:COMPLETED:0 openLinkCommand:FAILED:0
      exit 47
    fi
    exit 0
    ;;
  failed_interaction_before_restart)
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED tapOnElement:FAILED \
        stopAppCommand:COMPLETED openLinkCommand:FAILED
      exit 55
    fi
    exit 0
    ;;
  evaluated_assertion_in_restart_epoch)
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED stopAppCommand:COMPLETED \
        assertConditionCommand:COMPLETED runFlowCommand:RUNNING
      exit 56
    fi
    exit 0
    ;;
  interaction_in_restart_epoch)
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED stopAppCommand:COMPLETED \
        tapOnElement:COMPLETED runFlowCommand:RUNNING
      exit 57
    fi
    exit 0
    ;;
  failed_assertion)
    # The Android event-checklists shape: an assertion reached FAILED.
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED inputTextCommand:COMPLETED assertConditionCommand:FAILED
      exit 47
    fi
    exit 0
    ;;
  assertion_evidence_in_output)
    # The command record looks like a clean startup failure, but the harness
    # output carries assertion evidence. The assertion guard runs first and wins
    # outright, so this stays terminal.
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:RUNNING
      echo 'Assertion failed: assertVisible element not found' >&2
      exit 48
    fi
    exit 0
    ;;
  interaction_failure)
    # No assertion was evaluated, but the flow got as far as tapping. It left
    # startup, so it is terminal.
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED tapOnElement:FAILED
      exit 49
    fi
    exit 0
    ;;
  skipped_assertion_past_startup)
    # A `when:` guard declined the only assertion, so nothing was evaluated —
    # but the flow still left startup. SKIPPED is not evidence, and a
    # non-startup last command is not retryable either.
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED assertConditionCommand:SKIPPED tapOnElement:COMPLETED
      exit 50
    fi
    exit 0
    ;;
  skipped_assertion_in_startup)
    # The same SKIPPED assertion, but the flow died back in startup. A declined
    # assertion proves nothing about the app, so this is still retryable —
    # SKIPPED must not be mistaken for an evaluated status.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        assertConditionCommand:SKIPPED launchAppCommand:RUNNING
      exit 52
    fi
    emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:COMPLETED assertConditionCommand:COMPLETED
    exit 0
    ;;
  retry_then_assertion_failure)
    # Attempt 1 dies in startup and is retried; attempt 2 reaches a real failing
    # assertion. The classifier must read *this* attempt's record, not the
    # retryable one the previous attempt left behind, and stop at 2 of 4.
    if [ "$flow" = alpha ] && [ "$count" -eq 1 ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" launchAppCommand:RUNNING
      exit 53
    fi
    if [ "$flow" = alpha ]; then
      emit_commands "${LAUNCH_PROLOGUE[@]}" \
        launchAppCommand:COMPLETED assertConditionCommand:FAILED
      exit 54
    fi
    exit 0
    ;;
  malformed_record)
    # An unreadable record must fail closed to terminal, like the rest of ADR 038.
    if [ "$flow" = alpha ]; then
      dir="$MAESTRO_DEBUG_ROOT/run-$flow-$count/$flow"
      mkdir -p "$dir"
      echo 'not json' > "$dir/commands.json"
      exit 51
    fi
    exit 0
    ;;
  malformed_command_entry)
    # Parseable JSON with an incomplete Maestro entry is malformed too.
    if [ "$flow" = alpha ]; then
      dir="$MAESTRO_DEBUG_ROOT/run-$flow-$count/$flow"
      mkdir -p "$dir"
      echo '[{"command":{"launchAppCommand":{}},"metadata":{"status":"RUNNING"}}]' > "$dir/commands.json"
      exit 58
    fi
    exit 0
    ;;
esac
SH
  chmod +x "$fixture/bin/maestro"
  echo "$fixture"
}

run_fixture() {
  local fixture="$1" scenario="$2" expected="$3"
  shift 3
  set +e
  PATH="$fixture/bin:$PATH" \
    E2E_SERVER="$fixture/server" \
    MAESTRO_DIR="$fixture/flows" \
    MAESTRO_LOG_ROOT="$fixture/logs" \
    MAESTRO_DEBUG_ROOT="$fixture/debug" \
    STATE_DIR="$fixture/state" \
    CALL_LOG="$fixture/calls" \
    SCENARIO="$scenario" \
    "$HARNESS" "$@" > "$fixture/output" 2>&1
  status=$?
  set -e
  [ "$status" -eq "$expected" ] || \
    fail "$scenario returned $status instead of $expected; output: $(cat "$fixture/output")"
}

# A scenario that retries once and then completes the whole flow set.
assert_retried_then_passed() {
  local fixture="$1" what="$2"
  assert_count 2 '^alpha:' "$fixture/calls"
  assert_count 1 '^beta:' "$fixture/calls"
  assert_count 1 '^up$' "$fixture/calls"
  assert_count 1 '^down$' "$fixture/calls"
  grep -q 'retryable startup failure' "$fixture/output" || \
    fail "$what was not classified as a retryable startup failure"
}

# A scenario that must stop the run dead on its first attempt.
assert_terminal() {
  local fixture="$1" what="$2"
  assert_count 1 '^alpha:' "$fixture/calls"
  assert_count 0 '^beta:' "$fixture/calls"
  grep -q 'terminal non-startup failure' "$fixture/output" || \
    fail "$what was not classified as terminal"
}

# One scenario, end to end. `fixture` is deliberately left global: a few cases
# assert more about their own fixture afterwards.
retryable_case() {
  local scenario="$1" what="$2"
  fixture="$(make_fixture "$scenario")"
  run_fixture "$fixture" "$scenario" 0 --startup-attempts 2
  assert_retried_then_passed "$fixture" "$what"
}

# `expected_status`, not `status`: `run_fixture` assigns a global `status`, and
# bash dynamic scoping would land that write in this function's local.
terminal_case() {
  local scenario="$1" expected_status="$2" what="$3"
  fixture="$(make_fixture "$scenario")"
  run_fixture "$fixture" "$scenario" "$expected_status" --startup-attempts 4
  assert_terminal "$fixture" "$what"
}

# --- Baseline: lifecycle, ordering, enumeration -------------------------------
fixture="$(make_fixture pass)"
run_fixture "$fixture" pass 0
[ "$(sed -n '2p' "$fixture/calls")" = 'alpha:1' ] || fail 'flows were not lexically ordered'
[ "$(sed -n '3p' "$fixture/calls")" = 'beta:1' ] || fail 'all top-level flows were not enumerated'
assert_count 1 '^up$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

# --- Retryable: the attempt evaluated no assertion and died in startup --------
retryable_case session_never_opened_flow 'a session that never opened the flow'
grep -q 'no command record' "$fixture/output" || \
  fail 'the missing per-flow command record was not reported'

retryable_case launch_never_completed 'the captured launchApp-never-completed shape'
grep -Fq 'last=launchAppCommand status=RUNNING' "$fixture/output" || \
  fail 'the classifier did not report the structural evidence it decided on'
# The decisive property: nothing in the output identified the failure. Only the
# command record did.
! grep -Eiq 'exception|NSPOSIXErrorDomain|code=60|driver not ready' "$fixture/output" || \
  fail 'the launch-never-completed fixture leaked a stack-trace signature'

retryable_case open_link_never_completed 'the deep-link reopen shape'

retryable_case completed_assertion_before_restart 'the captured phase-local restart shape'
captured_record="$(find "$fixture/debug" -path '*/alpha/commands.json' | sort | head -n 1)"
grep -Fq '12 command(s) recorded, last=openLinkCommand status=FAILED' "$fixture/output" || \
  fail 'the captured 12-command shape was not classified directly'

# --- The bound: a deterministic launch failure exhausts the budget, still red --
fixture="$(make_fixture deterministic_launch_failure)"
run_fixture "$fixture" deterministic_launch_failure 45 --startup-attempts 4
assert_count 4 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
grep -q 'retryable startup failure exhausted 4 attempt(s)' "$fixture/output" || \
  fail 'a deterministic launch failure did not exhaust the per-flow budget'
assert_count 1 '^logs$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

# --- Terminal: any assertion evidence, and anything past startup --------------
terminal_case failed_assertion_before_restart 47 'a FAILED assertion before the latest restart boundary'
failed_before_restart_fixture="$fixture"

terminal_case failed_interaction_before_restart 55 'a FAILED interaction before the latest restart boundary'
terminal_case evaluated_assertion_in_restart_epoch 56 'an evaluated assertion in the current restart epoch'
terminal_case interaction_in_restart_epoch 57 'a non-startup interaction in the current restart epoch'
terminal_case failed_assertion 47 'a FAILED assertion'
terminal_case assertion_evidence_in_output 48 'assertion evidence in the harness output'
terminal_case interaction_failure 49 'a failure past startup with no assertion'
terminal_case skipped_assertion_past_startup 50 'a skipped assertion followed by a non-startup command'

# SKIPPED is not an evaluated status: the same declined assertion inside startup
# stays retryable.
retryable_case skipped_assertion_in_startup 'a declined assertion inside startup'

# The classifier reads the record of the attempt that just ran, not the
# retryable one its predecessor left behind.
fixture="$(make_fixture retry_then_assertion_failure)"
run_fixture "$fixture" retry_then_assertion_failure 54 --startup-attempts 4
assert_count 2 '^alpha:' "$fixture/calls"
assert_count 0 '^beta:' "$fixture/calls"
grep -q 'terminal non-startup failure' "$fixture/output" || \
  fail 'a failing assertion on the retry attempt was not terminal'

terminal_case malformed_record 51 'a malformed command record'
assert_count 1 '^logs$' "$fixture/calls"
assert_count 1 '^down$' "$fixture/calls"

terminal_case malformed_command_entry 58 'a malformed command entry'

# --- Mutation proof: the boundary and global-failure guards are load-bearing --
boundary_mutant="$TEST_ROOT/classifier-without-restart-boundary.mjs"
sed 's/const currentEpoch = commands.slice(boundaryIndex)/const currentEpoch = commands/' \
  "$CLASSIFIER" > "$boundary_mutant"
if node "$boundary_mutant" "$captured_record" >/dev/null 2>&1; then
  fail 'removing the restart boundary did not make the captured positive proof fail'
fi

failed_record="$(find "$failed_before_restart_fixture/debug" -path '*/alpha/commands.json' | sort | head -n 1)"
global_failure_mutant="$TEST_ROOT/classifier-without-global-failure-guard.mjs"
sed 's/\.some((entry) => entry?.metadata?.status === "FAILED")/.some(() => false)/' \
  "$CLASSIFIER" > "$global_failure_mutant"
if ! node "$global_failure_mutant" "$failed_record" >/dev/null 2>&1; then
  fail 'removing the global FAILED-command guard did not make the negative proof retryable'
fi

echo '[test_run_e2e] PASS'
