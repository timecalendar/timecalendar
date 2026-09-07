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

test("the cron cannot be relocated outside on.schedule", () => {
  const validWorkflow = readFileSync(workflowPath, "utf8");
  const workflow = validWorkflow
    .replace("  schedule:\n    - cron: '0 0 * * *'\n", "  schedule:\n")
    .concat("\nmisplaced-schedule:\n  - cron: '0 0 * * *'\n");
  assert.notEqual(workflow, validWorkflow);

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("on.schedule")));
});

test("the cut-off input cannot be relocated into the cleanup job environment", () => {
  const validWorkflow = readFileSync(workflowPath, "utf8");
  const cutOffBlock =
    "      cut-off:\n" +
    "        description: The timezone-aware datetime you want to delete container versions that are older than.\n" +
    "        required: false\n" +
    "        type: string\n";
  const misplacedCutOffBlock = cutOffBlock.replace(/^ {6}/gm, "      ");
  const workflow = validWorkflow
    .replace(
      cutOffBlock,
      "",
    )
    .replace(
      "    runs-on: ubuntu-latest\n",
      `    runs-on: ubuntu-latest\n    env:\n${misplacedCutOffBlock}`,
    );
  assert.notEqual(workflow, validWorkflow);

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("on.workflow_dispatch.inputs")));
});
