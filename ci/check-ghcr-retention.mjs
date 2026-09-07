#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ACTION = "snok/container-retention-policy@v2";
const PACKAGES = ["timecalendar", "timecalendar-web"];
const WORKFLOW = new URL("../.github/workflows/delete-old-images.yaml", import.meta.url);

function indentation(line) {
  return line.match(/^ */)[0].length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function meaningfulLines(source) {
  return source
    .split(/\r?\n/)
    .map((line) => ({ line: line.replace(/\s+$/, "") }))
    .filter(({ line }) => line.trim() && !line.trimStart().startsWith("#"));
}

function findBlock(lines, key, parentIndent = -1, start = 0, end = lines.length) {
  const keyIndent = parentIndent < 0 ? 0 : parentIndent + 2;
  const keyPattern = new RegExp(`^${" ".repeat(keyIndent)}${escapeRegExp(key)}:\\s*(?:#.*)?$`);
  const index = lines.findIndex(({ line }, candidate) =>
    candidate >= start && candidate < end && keyPattern.test(line),
  );
  if (index < 0) return null;

  const indent = indentation(lines[index].line);
  let blockEnd = index + 1;
  while (blockEnd < end && indentation(lines[blockEnd].line) > indent) blockEnd += 1;
  return { start: index, end: blockEnd, indent };
}

function stepBlocks(lines, job) {
  const steps = findBlock(lines, "steps", job.indent, job.start + 1, job.end);
  if (!steps) return [];

  const starts = [];
  for (let index = steps.start + 1; index < steps.end; index += 1) {
    if (indentation(lines[index].line) === steps.indent + 2 && /^\s*-\s+/.test(lines[index].line)) {
      starts.push(index);
    }
  }
  return starts.map((start, index) => ({
    start,
    end: starts[index + 1] ?? steps.end,
    indent: steps.indent + 2,
  }));
}

function scalarMap(lines, block, key) {
  const nested = findBlock(lines, key, block.indent, block.start + 1, block.end);
  if (!nested) return null;

  const values = new Map();
  for (let index = nested.start + 1; index < nested.end; index += 1) {
    const line = lines[index].line;
    if (indentation(line) !== nested.indent + 2) continue;
    const match = line.trim().match(/^([^:#][^:]*):\s*(.*?)\s*$/);
    if (match) values.set(match[1].trim(), match[2]);
  }
  return values;
}

function stepValue(lines, step, key) {
  const pattern = new RegExp(`^(?:-\\s+)?${escapeRegExp(key)}:\\s*(.*?)\\s*$`);
  for (let index = step.start; index < step.end; index += 1) {
    const line = lines[index].line;
    if (indentation(line) !== step.indent && indentation(line) !== step.indent + 2) continue;
    const match = line.trim().match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function validateRetentionWorkflow(source) {
  const lines = meaningfulLines(source);
  const errors = [];
  const require = (condition, message) => {
    if (!condition) errors.push(message);
  };

  require(lines.some(({ line }) => /^\s*-\s+cron:\s*['"]0 0 \* \* \*['"]\s*$/.test(line)), "daily midnight schedule is missing");
  require(lines.some(({ line }) => /^\s+workflow_dispatch:\s*$/.test(line)), "workflow_dispatch is missing");
  require(lines.some(({ line }) => /^\s+cut-off:\s*$/.test(line)), "cut-off input is missing");

  const jobs = findBlock(lines, "jobs");
  const job = jobs && findBlock(lines, "clean-ghcr", jobs.indent, jobs.start + 1, jobs.end);
  require(job, "clean-ghcr job is missing");
  if (!job) return errors;

  const permissions = scalarMap(lines, job, "permissions");
  require(permissions, "clean-ghcr must declare job-level permissions");
  if (permissions) {
    require(permissions.size === 1 && permissions.get("packages") === "write", "clean-ghcr permissions must be exactly packages: write");
  }

  const retentionSteps = stepBlocks(lines, job).filter((step) => stepValue(lines, step, "uses") === ACTION);
  require(retentionSteps.length === 2, `expected exactly 2 ${ACTION} steps, found ${retentionSteps.length}`);

  const seen = [];
  for (const step of retentionSteps) {
    const inputs = scalarMap(lines, step, "with") ?? new Map();
    const imageName = inputs.get("image-names");
    seen.push(imageName);
    require(PACKAGES.includes(imageName), `retention step has unexpected exact image name: ${imageName ?? "<missing>"}`);
    require(inputs.get("token") === "${{ github.token }}", `${imageName ?? "retention step"} must use github.token`);
    require(inputs.get("token-type") === "github-token", `${imageName ?? "retention step"} must use github-token mode`);
    require(inputs.get("account-type") === "org", `${imageName ?? "retention step"} must target an organization account`);
    require(inputs.get("org-name") === "timecalendar", `${imageName ?? "retention step"} must target the timecalendar organization`);
    require(inputs.get("cut-off") === "${{ inputs.cut-off || '1 week ago UTC' }}", `${imageName ?? "retention step"} must retain the cut-off fallback`);
    require(inputs.get("dry-run") === "${{ github.event_name == 'workflow_dispatch' }}", `${imageName ?? "retention step"} must force manual runs to dry-run`);
    require(Number(inputs.get("keep-at-least")) >= 5, `${imageName ?? "retention step"} must keep at least five versions`);
    const protectedTags = new Set((inputs.get("skip-tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean));
    require(protectedTags.has("latest") && protectedTags.has("production"), `${imageName ?? "retention step"} must protect latest and production`);
  }

  require(PACKAGES.every((name) => seen.filter((candidate) => candidate === name).length === 1), "each required package must have exactly one retention step");
  require(!/secrets\.PAT\b/.test(source), "stored PAT reference must not be present");
  return errors;
}

export function main(path = fileURLToPath(WORKFLOW)) {
  const errors = validateRetentionWorkflow(readFileSync(path, "utf8"));
  if (errors.length) {
    for (const error of errors) console.error(`GHCR retention contract: ${error}`);
    return 1;
  }
  console.log("GHCR retention contract: valid");
  return 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = main(process.argv[2]);
}
