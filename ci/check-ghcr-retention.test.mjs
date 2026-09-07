import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateRetentionWorkflow } from "./check-ghcr-retention.mjs";

const workflowPath = new URL("../.github/workflows/delete-old-images.yaml", import.meta.url);

test("the committed retention workflow satisfies the contract", () => {
  assert.deepEqual(validateRetentionWorkflow(readFileSync(workflowPath, "utf8")), []);
});

test("comments cannot provide missing authentication or safety inputs", () => {
  const workflow = readFileSync(workflowPath, "utf8").replace(
    "          token-type: github-token",
    "          # token-type: github-token\n          # dry-run: ${{ github.event_name == 'workflow_dispatch' }}",
  );

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("github-token mode")));
});

test("one package step cannot provide the other package's safeguards", () => {
  const workflow = readFileSync(workflowPath, "utf8").replace(
    /          skip-tags: latest, production\n(?=          token: \$\{\{ github\.token \}\}\n          token-type: github-token\n          dry-run:)/,
    "",
  );

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("must protect latest and production")));
});

test("extra retention invocations are rejected", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const extraStep = workflow.slice(workflow.indexOf("      - name: Retain server images"));
  const errors = validateRetentionWorkflow(`${workflow}\n${extraStep}`);
  assert(errors.some((error) => error.includes("expected exactly 2")));
});
