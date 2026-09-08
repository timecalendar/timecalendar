#!/usr/bin/env bash

set -euo pipefail

readonly CHART_DIR="${1:-k8s/timecalendar}"

assert_server_probe_paths() {
  local rendered
  rendered="$(helm template timecalendar "$CHART_DIR" --show-only templates/server-deployment.yaml)"

  local liveness_block
  liveness_block="$(awk '
    /^[[:space:]]*livenessProbe:/ { capture = 1; next }
    /^[[:space:]]*readinessProbe:/ { capture = 0 }
    capture
  ' <<<"$rendered")"

  local readiness_block
  readiness_block="$(awk '
    /^[[:space:]]*readinessProbe:/ { capture = 1; next }
    /^[[:space:]]*envFrom:/ { capture = 0 }
    capture
  ' <<<"$rendered")"

  assert_probe_path "livenessProbe" "/health/live" "$liveness_block"
  assert_probe_path "readinessProbe" "/health" "$readiness_block"
}

assert_probe_path() {
  local probe_name="$1"
  local expected_path="$2"
  local probe_block="$3"

  local path_count
  path_count="$(grep -c '^[[:space:]]*path:' <<<"$probe_block" || true)"
  if [[ "$path_count" -ne 1 ]]; then
    echo "Expected exactly one path in $probe_name, found $path_count" >&2
    return 1
  fi

  if ! grep -q "^[[:space:]]*path: ${expected_path}$" <<<"$probe_block"; then
    echo "Expected $probe_name path to render as $expected_path" >&2
    return 1
  fi
}

assert_queue_concurrency() {
  local expected="$1"
  shift

  local rendered
  rendered="$(helm template timecalendar "$CHART_DIR" "$@")"

  local key_count
  key_count="$(grep -c '^[[:space:]]*QUEUE_CONCURRENCY:' <<<"$rendered" || true)"
  if [[ "$key_count" -ne 1 ]]; then
    echo "Expected exactly one QUEUE_CONCURRENCY entry, found $key_count" >&2
    return 1
  fi

  if ! grep -q "^[[:space:]]*QUEUE_CONCURRENCY: \"${expected}\"$" <<<"$rendered"; then
    echo "Expected QUEUE_CONCURRENCY to render as \"${expected}\"" >&2
    return 1
  fi
}

readonly STAMP='--set-string server.podAnnotations.tim337=stamp'
readonly -a CHECKSUM_ENABLED=(--set server.configMapChecksumEnabled=true)

render_deployment() {
  local template="$1"
  shift

  helm template timecalendar "$CHART_DIR" --show-only "templates/$template" "$@"
}

# The unset default must render nothing at all -- not `annotations: {}`. Only a
# byte-identical default render proves this chart change cannot move a pod.
assert_pod_annotations_default_inert() {
  local rendered
  rendered="$(render_deployment server-deployment.yaml)"

  if grep -q '^[[:space:]]*annotations:' <<<"$rendered"; then
    echo "Expected no annotations line in the default server render; \`with\` must treat an empty podAnnotations map as falsy" >&2
    return 1
  fi
}

# The block must land on spec.template.metadata (indent 6), not the Deployment's
# own metadata (indent 2). Wrong placement still passes a presence grep while
# never rolling a pod.
assert_pod_annotations_placement() {
  local render_diff
  # shellcheck disable=SC2086 # STAMP is deliberately word-split into flags
  render_diff="$(diff <(render_deployment server-deployment.yaml) \
                       <(render_deployment server-deployment.yaml $STAMP) \
                    || true)"

  if grep -q '^< ' <<<"$render_diff"; then
    echo "Expected the stamped server render to remove no lines:" >&2
    echo "$render_diff" >&2
    return 1
  fi

  local added
  added="$(grep '^> ' <<<"$render_diff" || true)"

  local expected
  expected='>       annotations:
>         tim337: stamp'

  if [[ "$added" != "$expected" ]]; then
    echo "Expected the stamped server render to add exactly the pod-template annotations block:" >&2
    echo "$expected" >&2
    echo "got:" >&2
    echo "$added" >&2
    return 1
  fi
}

# server.podAnnotations is nested under `server` so it cannot reach the web pods.
assert_web_deployment_unaffected() {
  # shellcheck disable=SC2086 # STAMP is deliberately word-split into flags
  if ! diff <(render_deployment web-deployment.yaml) \
            <(render_deployment web-deployment.yaml $STAMP) >/dev/null; then
    echo "Expected the web Deployment render to be unchanged by server.podAnnotations" >&2
    return 1
  fi
}

assert_configmap_checksum_absent() {
  local rendered
  rendered="$(render_deployment server-deployment.yaml "$@")"

  if grep -q 'checksum/config:' <<<"$rendered"; then
    echo "Expected the ConfigMap checksum annotation to be absent" >&2
    return 1
  fi

  if grep -q '^[[:space:]]*annotations:' <<<"$rendered"; then
    echo "Expected no empty annotations block when the checksum is disabled" >&2
    return 1
  fi
}

configmap_checksum() {
  local rendered
  rendered="$(render_deployment server-deployment.yaml "$@")"

  local checksum_lines
  checksum_lines="$(grep -c '^        checksum/config: [[:xdigit:]]\{64\}$' <<<"$rendered" || true)"
  if [[ "$checksum_lines" -ne 1 ]]; then
    echo "Expected exactly one ConfigMap checksum on the server pod template, found $checksum_lines" >&2
    return 1
  fi

  local checksum_occurrences
  checksum_occurrences="$(grep -c 'checksum/config:' <<<"$rendered" || true)"
  if [[ "$checksum_occurrences" -ne 1 ]]; then
    echo "Expected no ConfigMap checksum outside the server pod template, found $checksum_occurrences total entries" >&2
    return 1
  fi

  sed -n 's/^        checksum\/config: //p' <<<"$rendered"
}

assert_configmap_checksum_annotations_compose() {
  local computed_checksum
  computed_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}")"

  local custom_render
  custom_render="$(render_deployment server-deployment.yaml "${CHECKSUM_ENABLED[@]}" \
    --set-string server.podAnnotations.tim292=stamp)"
  if ! grep -q '^        tim292: stamp$' <<<"$custom_render"; then
    echo "Expected a custom server pod annotation to survive beside the computed checksum" >&2
    return 1
  fi

  local custom_checksum
  custom_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}" \
    --set-string server.podAnnotations.tim292=stamp)"
  if [[ "$custom_checksum" != "$computed_checksum" ]]; then
    echo "Expected the computed checksum to survive beside a custom server pod annotation" >&2
    return 1
  fi

  local collision_checksum
  collision_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}" \
    --set-string server.podAnnotations.checksum/config=caller-supplied)"
  if [[ "$collision_checksum" != "$computed_checksum" ]]; then
    echo "Expected the computed checksum to override a colliding custom annotation" >&2
    return 1
  fi
}

assert_configmap_checksum_dependencies() {
  local baseline_checksum crisp_checksum tag_checksum
  baseline_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}")"
  crisp_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}" \
    --set-string timecalendar.crisp.websiteId=changed-for-checksum-test)"
  tag_checksum="$(configmap_checksum "${CHECKSUM_ENABLED[@]}" --set-string server.tag=checksum-test-tag)"

  if [[ "$crisp_checksum" == "$baseline_checksum" ]]; then
    echo "Expected a rendered ConfigMap value change to change checksum/config" >&2
    return 1
  fi

  if [[ "$tag_checksum" != "$baseline_checksum" ]]; then
    echo "Expected a server image tag change not to change checksum/config" >&2
    return 1
  fi
}

assert_env_from_precedence() {
  local rendered
  rendered="$(render_deployment server-deployment.yaml)"

  local sources
  sources="$(awk '
    /^          envFrom:$/ { capture = 1; next }
    /^          volumeMounts:$/ { capture = 0 }
    capture && /^            - (configMapRef|secretRef):$/ {
      sub(/^            - /, "")
      sub(/:$/, "")
      print
    }
  ' <<<"$rendered")"

  if [[ "$sources" != $'configMapRef\nsecretRef' ]]; then
    echo "Expected configMapRef first and secretRef second in server envFrom, got:" >&2
    echo "$sources" >&2
    return 1
  fi

  if grep -q 'later sources win duplicate keys' <<<"$rendered"; then
    echo "Expected the envFrom precedence warning to remain a source-only Helm comment" >&2
    return 1
  fi
}

assert_checksum_web_deployment_unaffected() {
  if ! diff <(render_deployment web-deployment.yaml) \
            <(render_deployment web-deployment.yaml "${CHECKSUM_ENABLED[@]}") >/dev/null; then
    echo "Expected the web Deployment render to be unchanged by the server ConfigMap checksum gate" >&2
    return 1
  fi
}

assert_queue_concurrency 10 --set timecalendar.queueConcurrency=10
assert_queue_concurrency 100
assert_queue_concurrency 100 --set-string timecalendar.queueConcurrency=
assert_server_probe_paths

echo "TimeCalendar chart queue-concurrency and server probe renders passed"

assert_pod_annotations_default_inert
assert_pod_annotations_placement
assert_web_deployment_unaffected

echo "TimeCalendar chart server podAnnotations renders passed"

assert_configmap_checksum_absent
assert_configmap_checksum_absent --set server.configMapChecksumEnabled=false
assert_configmap_checksum_annotations_compose
assert_configmap_checksum_dependencies
assert_env_from_precedence
assert_checksum_web_deployment_unaffected

echo "TimeCalendar chart server ConfigMap checksum renders passed"
