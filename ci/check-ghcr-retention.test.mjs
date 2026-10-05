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
    "          # token-type: github-token\n          # dry-run: true",
  );

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("github-token mode")));
});

test("one package step cannot provide the other package's safeguards", () => {
  const workflow = readFileSync(workflowPath, "utf8").replace(
    /          skip-tags: latest, production, main-\*\n(?=          token: \$\{\{ github\.token \}\}\n          token-type: github-token\n          dry-run:)/,
    "",
  );

  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("must protect latest, production, and main-*")));
});

test("immutable GitOps deployment tags cannot lose wildcard protection", () => {
  const workflow = readFileSync(workflowPath, "utf8").replaceAll(
    "skip-tags: latest, production, main-*",
    "skip-tags: latest, production, main",
  );

  const errors = validateRetentionWorkflow(workflow);
  assert.equal(errors.length, 2);
  assert(errors.every((error) => error.includes("main-* deployment tags")));
});

for (const packageName of ["timecalendar", "timecalendar-web"]) {
  for (const replacement of ["", "          filter-include-untagged: true", "          # filter-include-untagged: false"]) {
    test(`${packageName} cannot allow untagged manifest deletion with ${replacement.trim() || "the action default"}`, () => {
      const validWorkflow = readFileSync(workflowPath, "utf8");
      const packageStart = validWorkflow.indexOf(`          image-names: ${packageName}\n`);
      const workflow = validWorkflow.slice(0, packageStart) + validWorkflow.slice(packageStart).replace(
        "          filter-include-untagged: false",
        replacement,
      );
      assert.notEqual(workflow, validWorkflow);

      assert.deepEqual(validateRetentionWorkflow(workflow), [
        `${packageName} must exclude untagged OCI child manifests from deletion`,
      ]);
    });
  }
}

test("extra retention invocations are rejected", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const extraStep = workflow.slice(workflow.indexOf("      - name: Retain server images"));
  const errors = validateRetentionWorkflow(`${workflow}\n${extraStep}`);
  assert(errors.some((error) => error.includes("expected exactly 2")));
});

for (const trigger of ["  schedule:\n    - cron: '0 0 * * *'\n", "  push:\n", "  schedule: []\n"]) {
  test(`automatic trigger ${trigger.trim()} cannot enable cleanup`, () => {
    const workflow = readFileSync(workflowPath, "utf8").replace("on:\n", `on:\n${trigger}`);
    const errors = validateRetentionWorkflow(workflow);
    assert(errors.some((error) => error.includes("automatic cleanup is disabled")));
  });
}

test("the audit cannot gain package write permissions", () => {
  const workflow = readFileSync(workflowPath, "utf8").replace("packages: read", "packages: write");
  const errors = validateRetentionWorkflow(workflow);
  assert(errors.some((error) => error.includes("exactly packages: read")));
});

for (const replacement of ["false", "${{ github.event_name == 'workflow_dispatch' }}"]) {
  test(`dry-run cannot become ${replacement}`, () => {
    const workflow = readFileSync(workflowPath, "utf8").replaceAll("dry-run: true", `dry-run: ${replacement}`);
    const errors = validateRetentionWorkflow(workflow);
    assert.equal(errors.length, 2);
    assert(errors.every((error) => error.includes("unconditionally force dry-run")));
  });
}

test("the cut-off input cannot be relocated into the cleanup job environment", () => {
  const validWorkflow = readFileSync(workflowPath, "utf8");
  const cutOffBlock =
    "      cut-off:\n" +
    "        description: The timezone-aware cutoff for listing old container versions without deleting them.\n" +
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
