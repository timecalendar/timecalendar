// Tests for ci/disclosure-scan.mjs. Run with:
//   node --test ci/disclosure-scan.test.mjs
//
// Every fixture is synthetic. More than that: no fixture that is *supposed* to
// match is written as a literal in this file. They are assembled from parts at
// run time, so no source line here is itself a finding — which keeps this file
// inside the gate's own scan instead of needing an exemption, and an exemption
// is exactly the hole someone would later hide a real disclosure in.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  FINDING_CLASSES,
  compileLiteralPattern,
  deriveIdentityPatterns,
  loadAllowlist,
  matchesAny,
  parseAddedLines,
  parseConfiguredPatterns,
  scanRecords,
  structuralClasses,
} from "./disclosure-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const allowlist = loadAllowlist();

// Assemble-at-run-time helpers — see the header.
const addr = (local, domain) => `${local}@${domain}`;
const homePath = (user) => `${"/home/"}${user}`;
const profileUrl = (login) => `${"https://github.com/"}${login}`;
const coAuthor = (name, address) => `${"Co-authored-by:"} ${name} <${address}>`;

const record = (text, location = "fixture.md:1") => ({
  source: "diff",
  file: "fixture.md",
  line: 1,
  location,
  text,
});

const classesOf = (findings) => findings.map((finding) => finding.class);

// ---------------------------------------------------------------------------
// Layer 1 — derivation from commit authors
// ---------------------------------------------------------------------------

test("derives name, address, local part, domain and domain label per identity", () => {
  const derived = deriveIdentityPatterns(
    [{ name: "Aline Fixture", email: addr("aline", "fixture-domain.example") }],
    allowlist,
  );

  assert.deepEqual(derived.slice().sort(), [
    "Aline Fixture",
    addr("aline", "fixture-domain.example"),
    "aline",
    "fixture-domain",
    "fixture-domain.example",
  ].sort());
});

test("strips the numeric prefix from a forge noreply local part", () => {
  const derived = deriveIdentityPatterns(
    [{ name: "Fixture Person", email: addr("12345+fixturelogin", "mail.example") }],
    allowlist,
  );
  assert.ok(derived.includes("fixturelogin"));
});

test("drops bot identities and the platform CI identity", () => {
  const derived = deriveIdentityPatterns(
    [
      { name: "some-app[bot]", email: addr("9+some-app[bot]", "users.noreply.github.com") },
      // The forge's own CI identity has a human-shaped display name that occurs
      // legitimately in workflows and docs; dropping `[bot]` alone misses it.
      { name: "Github Actions", email: addr("actions", "github.com") },
    ],
    allowlist,
  );
  assert.deepEqual(derived, []);
});

test("does not derive a domain pattern from a consumer mail provider", () => {
  const derived = deriveIdentityPatterns(
    [{ name: "Aline Fixture", email: addr("aline", "gmail.com") }],
    allowlist,
  );
  assert.ok(!derived.includes("gmail.com"));
  assert.ok(!derived.includes("gmail"));
  assert.ok(derived.includes("Aline Fixture"));
});

test("drops tokens too short to be anything but a word, keeping the address itself", () => {
  const derived = deriveIdentityPatterns(
    [{ name: "Al", email: addr("al", "gmail.com") }],
    allowlist,
  );
  // A two-letter name or local part would match prose everywhere. The full
  // address is unambiguous, so it stays.
  assert.deepEqual(derived, [addr("al", "gmail.com")]);
});

test("does not treat a pinned version as an address", () => {
  for (const text of [
    "uses: azure/setup-helm@v4.3.1",
    "react-native@0.81.5",
    "npm i @scope/pkg@1.2.3",
  ]) {
    assert.deepEqual(structuralClasses(text, allowlist), [], text);
  }
});

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

test("literal patterns match on word boundaries, case-insensitively", () => {
  const compiled = [compileLiteralPattern("Aline")];
  assert.ok(matchesAny("reported by aline last week", compiled));
  assert.ok(matchesAny("(ALINE)", compiled));
  assert.ok(!matchesAny("alineation of the layout", compiled));
  assert.ok(!matchesAny("Cavaline", compiled));
});

test("a dotted pattern still matches when punctuation follows", () => {
  const compiled = [compileLiteralPattern("fixture-domain.example")];
  assert.ok(matchesAny("see <fixture-domain.example>.", compiled));
});

// ---------------------------------------------------------------------------
// Layer 2 — structural rules
// ---------------------------------------------------------------------------

test("flags an address on a domain that is not allowlisted", () => {
  assert.deepEqual(structuralClasses(addr("aline", "fixture-domain.example"), allowlist), [
    FINDING_CLASSES.EMAIL,
  ]);
});

test("passes documentation, product and test-fixture domains", () => {
  for (const domain of ["example.com", "example.fr", "sub.example.test", "timecalendar.app"]) {
    assert.deepEqual(structuralClasses(addr("someone", domain), allowlist), []);
  }
});

test("passes role addresses regardless of domain, so commit trailers do not fail every change", () => {
  assert.deepEqual(structuralClasses(addr("noreply", "fixture-domain.example"), allowlist), []);
});

test("does not treat an asset filename as an address", () => {
  assert.deepEqual(structuralClasses("logo@2x.png and icon@3x.png", allowlist), []);
});

test("flags a bare profile URL but not a repository link", () => {
  assert.deepEqual(structuralClasses(profileUrl("fixturelogin"), allowlist), [
    FINDING_CLASSES.PROFILE_URL,
  ]);
  assert.deepEqual(structuralClasses(`${profileUrl("fixtureorg")}/some-repo`, allowlist), []);
  assert.deepEqual(structuralClasses(`${profileUrl("fixtureorg")}/some-repo.git`, allowlist), []);
});

test("flags a bare profile URL that ends a sentence", () => {
  assert.deepEqual(structuralClasses(`see ${profileUrl("fixturelogin")}.`, allowlist), [
    FINDING_CLASSES.PROFILE_URL,
  ]);
});

test("passes a generated placeholder and an allowlisted route", () => {
  assert.deepEqual(structuralClasses(`${profileUrl("GIT_USER_ID")}/GIT_REPO_ID`, allowlist), []);
  assert.deepEqual(structuralClasses(profileUrl("sponsors"), allowlist), []);
});

test("flags a home directory named after a person, not the shared account", () => {
  assert.deepEqual(structuralClasses(`cd ${homePath("aline")}/work`, allowlist), [
    FINDING_CLASSES.HOME_PATH,
  ]);
  assert.deepEqual(structuralClasses(`cd ${homePath("dev")}/work`, allowlist), []);
});

test("does not treat a package-relative import as a home directory", () => {
  assert.deepEqual(
    structuralClasses("import 'package:app/modules/home/screens/tabs_screen.dart';", allowlist),
    [],
  );
});

test("flags a co-author trailer whose address is not a role address", () => {
  assert.ok(
    structuralClasses(
      coAuthor("Aline Fixture", addr("aline", "example.com")),
      allowlist,
    ).includes(FINDING_CLASSES.CO_AUTHOR),
  );
  assert.deepEqual(
    structuralClasses(coAuthor("Some Tool", addr("noreply", "fixture-domain.example")), allowlist),
    [],
  );
});

// ---------------------------------------------------------------------------
// Layer 3 — the injected secret
// ---------------------------------------------------------------------------

test("parses configured patterns from newlines or commas, absent means empty", () => {
  assert.deepEqual(parseConfiguredPatterns("alpha\nbeta, gamma\n\n"), [
    "alpha",
    "beta",
    "gamma",
  ]);
  assert.deepEqual(parseConfiguredPatterns(undefined), []);
  assert.deepEqual(parseConfiguredPatterns(""), []);
});

test("an absent secret does not disable the derived or structural layers", () => {
  const findings = scanRecords([record("contact aline about it")], {
    derived: ["aline"],
    configured: parseConfiguredPatterns(undefined),
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
});

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

test("a supplied pattern is flagged with file and line", () => {
  const findings = scanRecords([record("released by aline", "docs/notes.md:42")], {
    derived: [],
    configured: ["aline"],
    allowlist,
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].class, FINDING_CLASSES.CONFIGURED);
  assert.equal(findings[0].file, "fixture.md");
  assert.equal(findings[0].line, 1);
  assert.equal(findings[0].location, "docs/notes.md:42");
});

test("a clean line produces no findings", () => {
  assert.deepEqual(
    scanRecords([record("the calendar sync runs every ten minutes")], {
      derived: ["aline"],
      configured: ["beta"],
      allowlist,
    }),
    [],
  );
});

test("a finding never carries the matched text, the pattern, or the line", () => {
  const secret = "aline-fixture-token";
  const findings = scanRecords([record(`written by ${secret} here`)], {
    derived: [],
    configured: [secret],
    allowlist,
  });
  assert.equal(findings.length, 1);
  const serialised = JSON.stringify(findings);
  assert.ok(!serialised.includes(secret));
  assert.ok(!serialised.includes("written by"));
});

test("the same location and class is reported once", () => {
  const findings = scanRecords([record("aline and aline again")], {
    derived: ["aline"],
    configured: [],
    allowlist,
  });
  assert.equal(findings.length, 1);
});

// ---------------------------------------------------------------------------
// Diff parsing
// ---------------------------------------------------------------------------

test("maps added lines to their new-file line numbers and ignores removals", () => {
  const diff = [
    "diff --git a/docs/notes.md b/docs/notes.md",
    "--- a/docs/notes.md",
    "+++ b/docs/notes.md",
    "@@ -3,1 +3,2 @@",
    "-gone",
    "+first added",
    "+second added",
    "@@ -20,0 +21,1 @@",
    "+later added",
    "",
  ].join("\n");

  assert.deepEqual(
    parseAddedLines(diff).map((entry) => [entry.location, entry.text]),
    [
      ["docs/notes.md:3", "first added"],
      ["docs/notes.md:4", "second added"],
      ["docs/notes.md:21", "later added"],
    ],
  );
});

test("ignores additions attributed to a deleted file", () => {
  const diff = ["--- a/gone.md", "+++ /dev/null", "@@ -1,1 +0,0 @@", "-gone"].join("\n");
  assert.deepEqual(parseAddedLines(diff), []);
});

// ---------------------------------------------------------------------------
// Wiring and self-consistency
// ---------------------------------------------------------------------------

const WORKFLOW = resolve(REPO, ".github/workflows/ci-build-deploy.yml");

test("CI invokes the scan and checks out enough history to derive from", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  assert.match(workflow, /node ci\/disclosure-scan\.mjs/);
  const job = workflow.slice(workflow.indexOf("scan-disclosure:"));
  assert.match(job.slice(0, job.indexOf("\n  build-server:")), /fetch-depth: 0/);
});

test("the gate's own sources would pass the gate", () => {
  // A control whose source is itself the leak is worthless, and a workflow file
  // carrying a pattern would be exactly that.
  for (const file of [
    "ci/disclosure-scan.mjs",
    "ci/disclosure-allowlist.json",
    "ci/disclosure-scan.test.mjs",
    ".github/workflows/ci-build-deploy.yml",
  ]) {
    const lines = readFileSync(resolve(REPO, file), "utf8").split("\n");
    lines.forEach((text, index) => {
      assert.deepEqual(
        structuralClasses(text, allowlist),
        [],
        `${file}:${index + 1} would be flagged by the gate it belongs to`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// The published application identifier
// ---------------------------------------------------------------------------

const appId = (label) => `fr.${label}.timecalendar.dev`;
const serviceId = (label) => `timecalendar-${label}`;

test("excuses a derived identity inside the reverse-DNS application identifier", () => {
  const findings = scanRecords([record(`appId: ${appId("fixtureowner")}`)], {
    derived: ["fixtureowner"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(findings, []);
});

test("still flags the same identity as a host name or on its own", () => {
  for (const text of [
    "https://fixtureowner.example/",
    "sub.fixtureowner.example",
    "written by fixtureowner",
  ]) {
    const findings = scanRecords([record(text)], {
      derived: ["fixtureowner"],
      configured: [],
      allowlist,
    });
    assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED], text);
  }
});

test("excuses a derived identity inside the hyphenated service identifier", () => {
  const findings = scanRecords([record(`projectId: ${serviceId("fixtureowner")}`)], {
    derived: ["fixtureowner"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(findings, []);
});

test("a hyphenated component of a host name does not inherit the exemption", () => {
  const findings = scanRecords([record(`${serviceId("fixtureowner")}.example.com`)], {
    derived: ["fixtureowner"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
});

test("an account handle and a personal repository path stay flagged", () => {
  for (const text of ["@fixtureowner/timecalendar", "fixtureowner/app-certificates"]) {
    const findings = scanRecords([record(text)], {
      derived: ["fixtureowner"],
      configured: [],
      allowlist,
    });
    assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED], text);
  }
});

test("the exemption needs our product label, not merely the reverse-DNS shape", () => {
  const findings = scanRecords([record("fr.fixtureowner.someotherapp.dev")], {
    derived: ["fixtureowner"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
});

// ---------------------------------------------------------------------------
// The credit surface
// ---------------------------------------------------------------------------

const creditRecord = (text) => ({
  source: "diff",
  file: "mobile/src/features/about/ui/about-screen.tsx",
  line: 1,
  location: "mobile/src/features/about/ui/about-screen.tsx:1",
  text,
});

test("an identity on the credit surface is the product, not a leak", () => {
  assert.deepEqual(
    scanRecords([creditRecord("built by Aline Fixture")], {
      derived: ["Aline Fixture"],
      configured: [],
      allowlist,
    }),
    [],
  );
});

test("structural rules still apply on the credit surface", () => {
  const findings = scanRecords([creditRecord(homePath("aline"))], {
    derived: [],
    configured: [],
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.HOME_PATH]);
});

test("the same identity outside the credit surface is still flagged", () => {
  const findings = scanRecords([record("built by Aline Fixture")], {
    derived: ["Aline Fixture"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
});
