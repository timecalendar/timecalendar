// Tests for ci/disclosure-scan.mjs. Run with:
//   node --test ci/disclosure-scan.test.mjs
//
// Every fixture is synthetic. More than that: no fixture that is *supposed* to
// match is written as a literal in this file. They are assembled from parts at
// run time, so no source line here is itself a finding — which keeps this file
// inside the gate's own scan instead of needing an exemption, and an exemption
// is exactly the hole someone would later hide a real disclosure in.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  FINDING_CLASSES,
  compileConfiguredPattern,
  compileConfiguredPatterns,
  compileLiteralPattern,
  compareCiBaseline,
  deriveIdentityPatterns,
  loadAllowlist,
  main,
  matchesAny,
  parseAddedLines,
  parseBaseline,
  parseConfiguredPatterns,
  scanRecords,
  scanWholeFiles,
  selfTestConfigured,
  structuralClasses,
  structuralCounts,
} from "./disclosure-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const allowlist = loadAllowlist();

// Assemble-at-run-time helpers — see the header.
const addr = (local, domain) => `${local}@${domain}`;
const homePath = (user) => `${"/home/"}${user}`;
const macHomePath = (user) => `${"/Users/"}${user}`;
const profileUrl = (login) => `${"https://github.com/"}${login}`;
const coAuthor = (name, address) => `${"Co-authored-by:"} ${name} <${address}>`;

// The configured layer takes compiled expressions, not strings: compiling one
// can fail, and that failure belongs to the exit code, not to a scan loop.
const configuredPatterns = (...sources) => sources.map(compileConfiguredPattern);

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

test("flags a home directory, in either spelling", () => {
  for (const path of [homePath("aline"), macHomePath("aline")]) {
    assert.deepEqual(structuralClasses(`cd ${path}/work`, allowlist), [
      FINDING_CLASSES.HOME_PATH,
    ]);
  }
});

test("exempts a home path by prefix, never by account", () => {
  // The account a fleet runs under is the exact spelling of every host path it
  // would realistically leak, so allowlisting the account discards the whole
  // category. Only the published toolchain sub-path under it is exempt.
  assert.deepEqual(
    structuralClasses(`${homePath("runner")}/work/repo`, allowlist),
    [],
  );
  assert.deepEqual(structuralClasses(`${homePath("dev")}/flutter/bin`, allowlist), []);
  assert.deepEqual(structuralClasses(`${homePath("dev")}/projects/app`, allowlist), [
    FINDING_CLASSES.HOME_PATH,
  ]);
  assert.deepEqual(structuralClasses(homePath("dev"), allowlist), [
    FINDING_CLASSES.HOME_PATH,
  ]);
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

test("parses one configured entry per line, absent means empty", () => {
  assert.deepEqual(
    parseConfiguredPatterns("alpha\nbeta\n\ngamma\n").map((e) => e.pattern),
    ["alpha", "beta", "gamma"],
  );
  assert.deepEqual(parseConfiguredPatterns(undefined), []);
  assert.deepEqual(parseConfiguredPatterns(""), []);
});

test("a comma does not separate configured entries", () => {
  // A configured entry is a regular expression, and `{2,}`, `{4,}` and every
  // character class contain a comma. Splitting on commas shreds one pasted
  // pattern into fragments that no longer compile — a silent no-op before the
  // fail-closed compile, and an unreadable red job after it.
  const commaQuantified = `fixture[a-z,]{2,}${"end"}`;
  const entries = parseConfiguredPatterns(commaQuantified);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].pattern, commaQuantified);
  assert.deepEqual(compileConfiguredPatterns(entries).invalid, []);
});

test("each configured entry keeps the line it came from", () => {
  const entries = parseConfiguredPatterns("\nalpha\n\n(unclosed\n");
  assert.deepEqual(
    entries.map((e) => e.line),
    [2, 4],
  );
});

test("configured entries are compiled as regexes, not escaped into literals", () => {
  const findings = scanRecords([record("build 4821 shipped")], {
    derived: [],
    configured: configuredPatterns("build \\d{4}"),
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.CONFIGURED]);
});

test("an entry that does not compile is reported by line, never by value", () => {
  const entries = parseConfiguredPatterns("fixture(unclosed");
  const { compiled, invalid } = compileConfiguredPatterns(entries);
  assert.deepEqual(compiled, []);
  assert.deepEqual(invalid, [1]);
});

// ---------------------------------------------------------------------------
// The probe column, and the self-test that consumes it
// ---------------------------------------------------------------------------

// Space, two colons, space. Assembled rather than written, like every other
// fixture here, so the delimiter is stated in exactly one place.
const withProbe = (pattern, probe) => `${pattern}${" :: "}${probe}`;

// Parse, compile, self-test — the whole layer as `main` runs it.
const loadConfigured = (raw) => {
  const entries = parseConfiguredPatterns(raw);
  const { compiled, invalid } = compileConfiguredPatterns(entries);
  return {
    entries,
    compiled,
    invalid,
    patterns: compiled.map((entry) => entry.regex),
    selfTest: selfTestConfigured(compiled),
  };
};

// These assert on MATCHING, not on parsing. A test that only counts entries
// passes before the probe column exists — the whole line is already one entry —
// so it would certify the state where the pattern is dead and every count is
// right.
test("a two-column entry yields a pattern that matches, not the whole line", () => {
  const loaded = loadConfigured(withProbe("widget", "widget"));
  assert.equal(loaded.entries.length, 1);
  assert.deepEqual(loaded.invalid, []);
  assert.deepEqual(loaded.selfTest, { covered: 1, failed: [] });

  const findings = scanRecords([record("a widget here")], {
    derived: [],
    configured: loaded.patterns,
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.CONFIGURED]);
});

test("a comma quantifier survives the probe column and still matches", () => {
  const loaded = loadConfigured(withProbe("a{4,}b", "aaaab"));
  assert.equal(loaded.entries.length, 1, "the comma does not shred the entry");
  assert.deepEqual(loaded.selfTest, { covered: 1, failed: [] });
});

test("a delimiter-bearing pattern round-trips via a bracketed colon", () => {
  // The pattern column may not contain the delimiter; the probe column may.
  // Splitting on the FIRST delimiter is what makes that asymmetry work — split
  // on the last and the cut lands inside the probe.
  const loaded = loadConfigured(withProbe("ns [:][:] name", "ns :: name"));
  assert.equal(loaded.entries.length, 1);
  assert.equal(loaded.entries[0].pattern, "ns [:][:] name");
  assert.equal(loaded.entries[0].probe, "ns :: name");
  assert.deepEqual(loaded.selfTest, { covered: 1, failed: [] });
});

test("a pattern-only line parses, and is skipped by the self-test", () => {
  const loaded = loadConfigured("widget");
  assert.equal(loaded.entries.length, 1);
  assert.equal(loaded.entries[0].probe, null);
  assert.deepEqual(loaded.selfTest, { covered: 0, failed: [] });
});

test("three lines are three entries, mixed columns and all", () => {
  const loaded = loadConfigured(
    [withProbe("widget", "widget"), "gadget", withProbe("a{4,}b", "aaaab")].join("\n"),
  );
  assert.equal(loaded.entries.length, 3);
  assert.deepEqual(loaded.selfTest, { covered: 2, failed: [] });
});

test("an entry with two probes is one entry", () => {
  const loaded = loadConfigured(
    [withProbe("widget", "widget"), withProbe("widget", "a widget")].join("\n"),
  );
  assert.equal(loaded.entries.length, 1);
});

test("an entry that does not match its own probe is reported by line", () => {
  const loaded = loadConfigured(withProbe("widget", "gadget"));
  assert.deepEqual(loaded.invalid, [], "it compiles — nothing else catches this");
  assert.deepEqual(loaded.selfTest, { covered: 1, failed: [1] });
});

test("a configured value of the shape an operator is asked to paste survives end to end", () => {
  // The shape that broke both ways: a character class containing a comma, which
  // the old parser split the value on, and an alternation the old compiler
  // escaped into a literal. Synthetic login, assembled at run time.
  const login = "fixtureowner";
  const value = `(?<![\\w.@-])${login}(?=[/)\\s,]|$)|/(?:Users|home)/${login}`;

  const { entries, patterns, invalid } = loadConfigured(value);
  assert.equal(entries.length, 1, "a comma inside the value does not split it");
  assert.deepEqual(invalid, []);

  const flagged = scanRecords([record(`shipped by ${login}, then ${login} again`)], {
    derived: [],
    configured: patterns,
    allowlist,
  });
  assert.deepEqual(classesOf(flagged), [FINDING_CLASSES.CONFIGURED]);
  assert.equal(flagged[0].count, 2);

  // Both home spellings, via the second alternative.
  for (const path of [homePath(login), macHomePath(login)]) {
    const findings = scanRecords([record(`${path}/src`)], {
      derived: [],
      configured: patterns,
      allowlist,
    });
    assert.ok(classesOf(findings).includes(FINDING_CLASSES.CONFIGURED), path);
  }

  // And the identifier the app publishes stays clean — the value's own
  // lookbehind holds, independently of the shape-based exemption.
  assert.deepEqual(
    scanRecords([record(`applicationId: fr.${login}.timecalendar.dev`)], {
      derived: [],
      configured: patterns,
      allowlist,
    }),
    [],
  );
});

test("an absent secret does not disable the derived or structural layers", () => {
  const findings = scanRecords([record("contact aline about it")], {
    derived: ["aline"],
    configured: loadConfigured(undefined).patterns,
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
});

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

test("a supplied pattern is flagged with file, line and count", () => {
  const findings = scanRecords([record("released by aline", "docs/notes.md:42")], {
    derived: [],
    configured: configuredPatterns("aline"),
    allowlist,
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].class, FINDING_CLASSES.CONFIGURED);
  assert.equal(findings[0].file, "fixture.md");
  assert.equal(findings[0].line, 1);
  assert.equal(findings[0].location, "docs/notes.md:42");
  assert.equal(findings[0].count, 1);
});

test("a clean line produces no findings", () => {
  assert.deepEqual(
    scanRecords([record("the calendar sync runs every ten minutes")], {
      derived: ["aline"],
      configured: configuredPatterns("beta"),
      allowlist,
    }),
    [],
  );
});

test("a finding never carries the matched text, the pattern, or the line", () => {
  const secret = "aline-fixture-token";
  const findings = scanRecords([record(`written by ${secret} here`)], {
    derived: [],
    configured: configuredPatterns(secret),
    allowlist,
  });
  assert.equal(findings.length, 1);
  const serialised = JSON.stringify(findings);
  assert.ok(!serialised.includes(secret));
  assert.ok(!serialised.includes("written by"));
});

// ---------------------------------------------------------------------------
// Occurrences, not matching lines (AC 2b)
// ---------------------------------------------------------------------------

test("two distinct patterns on one line are counted as two, not one", () => {
  // The exact miscount this gate exists to avoid: the disclosure surface is
  // table rows and prose sentences, which routinely carry two identities on one
  // line. Reporting 1 tells the author to scrub one of two.
  const findings = scanRecords([record("aline and blake shipped it")], {
    derived: ["aline", "blake"],
    configured: [],
    allowlist,
  });
  assert.equal(findings.length, 1, "one location and class");
  assert.equal(findings[0].count, 2);
});

test("counts repeats of a single pattern on one line", () => {
  const findings = scanRecords([record("aline and aline again")], {
    derived: ["aline"],
    configured: [],
    allowlist,
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 2);
});

test("occurrences at one location and class accumulate across records", () => {
  const findings = scanRecords([record("aline"), record("aline")], {
    derived: ["aline"],
    configured: [],
    allowlist,
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 2);
});

test("counts occurrences per structural class independently", () => {
  const counts = structuralCounts(
    `${addr("aline", "fixture-domain.example")} and ${addr("blake", "other-domain.example")} at ${homePath("aline")}/work`,
    allowlist,
  );
  assert.equal(counts.get(FINDING_CLASSES.EMAIL), 2);
  assert.equal(counts.get(FINDING_CLASSES.HOME_PATH), 1);
});

test("derived and configured layers report separate findings on one line", () => {
  const findings = scanRecords([record("aline and blake shipped it")], {
    derived: ["aline"],
    configured: configuredPatterns("blake"),
    allowlist,
  });
  assert.deepEqual(
    findings.map((f) => [f.class, f.count]).sort(),
    [
      [FINDING_CLASSES.CONFIGURED, 1],
      [FINDING_CLASSES.DERIVED, 1],
    ].sort(),
  );
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

test("scans an added line whose own content begins with a diff header prefix", () => {
  // Inside a hunk, `+++ x` is an added line reading `++ x` — a Markdown list, a
  // shell heredoc, a nested diff in a code fence. Read as a file header it is
  // skipped *and* re-points every following line at the wrong file.
  const diff = [
    "diff --git a/docs/notes.md b/docs/notes.md",
    "--- a/docs/notes.md",
    "+++ b/docs/notes.md",
    "@@ -1,0 +1,3 @@",
    "++ leading plus signs",
    "--- not a header either",
    "+++ and neither is this",
    "",
  ].join("\n");

  assert.deepEqual(
    parseAddedLines(diff).map((entry) => [entry.location, entry.text]),
    [
      ["docs/notes.md:1", "+ leading plus signs"],
      ["docs/notes.md:2", "++ and neither is this"],
    ],
  );
});

test("attributes each file's hunks to that file", () => {
  const diff = [
    "diff --git a/one.md b/one.md",
    "--- a/one.md",
    "+++ b/one.md",
    "@@ -1,0 +1,1 @@",
    "+first",
    "diff --git a/two.md b/two.md",
    "--- a/two.md",
    "+++ b/two.md",
    "@@ -5,0 +6,1 @@",
    "+second",
    "",
  ].join("\n");

  assert.deepEqual(
    parseAddedLines(diff).map((entry) => entry.location),
    ["one.md:1", "two.md:6"],
  );
});

// ---------------------------------------------------------------------------
// Wiring and self-consistency
// ---------------------------------------------------------------------------

const WORKFLOW = resolve(REPO, ".github/workflows/ci-build-deploy.yml");

// An empty range: the entry point runs end to end over real git, and the only
// thing under test is what it decides, not what the branch happens to contain.
function runMain(env, argv = ["--base", "HEAD", "--head", "HEAD", "--cwd", REPO]) {
  const output = [];
  const capture = (...args) => output.push(args.join(" "));
  const [log, error] = [console.log, console.error];
  console.log = capture;
  console.error = capture;
  try {
    return {
      code: main(argv, env),
      output: output.join("\n"),
    };
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("an empty range with no secret passes, and the log says which layers ran", () => {
  const { code, output } = runMain({});
  assert.equal(code, 0);
  assert.match(output, /structural: on/);
  assert.match(output, /configured secret: absent/);
  assert.match(output, /derived and structural layers still apply/);
});

test("a short nonblank configured expression activates instead of looking absent", () => {
  const { code, output } = runMain({ DISCLOSURE_PATTERNS: "x" });
  assert.equal(code, 0);
  assert.match(output, /configured secret: present, 1 entries, 1 compiled/);
  assert.doesNotMatch(output, /configured secret: absent/);
});

test("the log reports entries, compiles and self-test coverage separately", () => {
  const { code, output } = runMain({
    DISCLOSURE_PATTERNS: withProbe("fixture-token-[0-9]+", "fixture-token-42"),
  });
  assert.equal(code, 0);
  assert.match(output, /1 entries, 1 compiled, self-test 1\/1/);
});

test("an unverified entry is named as unverified, not implied to be armed", () => {
  const { code, output } = runMain({ DISCLOSURE_PATTERNS: "fixture-token-[0-9]+" });
  assert.equal(code, 0);
  assert.match(output, /self-test 0\/1/);
  assert.match(output, /carry no probe and are unverified/);
});

test("an entry that matches nothing it claims to fails the job, printing neither column", () => {
  // The state nothing else detects: it parses, it compiles, the counts are all
  // correct, and it matches nothing. Without this the improved census reads
  // *more* convincing than the old one while the layer is dead.
  const pattern = "fixture-token-[0-9]+";
  const probe = "fixture-token-none";
  const { code, output } = runMain({ DISCLOSURE_PATTERNS: withProbe(pattern, probe) });
  assert.equal(code, 2);
  assert.ok(!output.includes(pattern), "the entry is the secret");
  assert.ok(!output.includes(probe), "a probe matches a forbidden pattern by construction");
  assert.match(output, /entry 1 does not match its own probe/);
});

test("a configured pattern that does not compile fails the job without printing it", () => {
  const broken = "fixture(unclosed";
  const { code, output } = runMain({ DISCLOSURE_PATTERNS: `valid-fixture\n${broken}` });
  assert.equal(code, 2, "fails closed rather than scanning without the pattern");
  assert.ok(!output.includes(broken), "the entry is the secret and is never printed");
  assert.match(output, /DISCLOSURE_PATTERNS entry 2 is not a valid regular expression/);
});

test("a matched path is redacted everywhere in end-to-end output", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "disclosure-path-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  const token = ["fixture", "path", "token"].join("-");

  git("init", "--quiet");
  git("config", "user.name", "Fixture Bot");
  git("config", "user.email", "noreply@example.com");
  writeFileSync(join(repo, "README.md"), "base\n");
  git("add", "README.md");
  git("commit", "--quiet", "-m", "base");
  const base = git("rev-parse", "HEAD").trim();

  const directory = join(repo, "docs", token);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "notes.md"), "safe fixture\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "add fixture path");

  const { code, output } = runMain(
    { DISCLOSURE_PATTERNS: token },
    ["--base", base, "--head", "HEAD", "--cwd", repo],
  );
  assert.equal(code, 1);
  assert.ok(!output.includes(token));
  assert.match(output, /file=docs\/\[REDACTED\]\/notes\.md/);
  assert.match(output, /docs\/\[REDACTED\]\/notes\.md/);
  assert.match(output, /configured-pattern/);
});

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

test("an added identity on the former credit surface is still a finding", () => {
  const findings = scanRecords([creditRecord("built by Aline Fixture")], {
    derived: ["Aline Fixture"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(classesOf(findings), [FINDING_CLASSES.DERIVED]);
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

test("the path lane narrows an existing path but not one created or renamed", () => {
  const path = "app/android/app/src/main/kotlin/fr/fixture/app/MainActivity.kt";
  const pathRecord = (introduced) => ({
    source: "path",
    file: path,
    line: null,
    location: path,
    text: path,
    introduced,
  });
  assert.deepEqual(
    scanRecords([pathRecord(false)], {
      derived: ["fixture"],
      configured: [],
      allowlist,
    }),
    [],
  );
  assert.deepEqual(
    classesOf(
      scanRecords([pathRecord(true)], {
        derived: ["fixture"],
        configured: [],
        allowlist,
      }),
    ),
    [FINDING_CLASSES.DERIVED],
  );
});

// ---------------------------------------------------------------------------
// Count-keyed whole-file baseline
// ---------------------------------------------------------------------------

const baseline = (ciEntries = [], entries = []) => ({ version: 1, entries, ciEntries });

test("baseline lanes require exact fields, positive counts and independent keys", () => {
  assert.deepEqual(parseBaseline(baseline()).ciEntries, []);
  for (const entry of [
    { path: "/absolute", id: "derived-identity", count: 1 },
    { path: "../outside", id: "derived-identity", count: 1 },
    { path: "fixture.md", id: "derived-identity", count: 0 },
    { path: "fixture.md", id: "derived-identity", count: 1, extra: true },
  ]) {
    assert.throws(() => parseBaseline(baseline([entry])));
  }
  const duplicate = { path: "fixture.md", id: "derived-identity", count: 1 };
  assert.throws(() => parseBaseline(baseline([duplicate, duplicate])));
  assert.doesNotThrow(() => parseBaseline(baseline([duplicate], [duplicate])));
});

test("whole-file layer passes at pin and reports over-pin and unpinned classes", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "disclosure-baseline-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const runGit = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  runGit("init", "--quiet");
  runGit("config", "user.name", "Fixture Bot");
  runGit("config", "user.email", "noreply@example.com");
  writeFileSync(
    join(repo, "fixture.md"),
    `Aline Fixture and Aline Fixture again\n${homePath("aline")}\n`,
  );
  runGit("add", "fixture.md");
  runGit("commit", "--quiet", "-m", "fixture");

  const scan = (ciEntries) =>
    scanWholeFiles({
      files: ["fixture.md"],
      head: "HEAD",
      baseline: baseline(ciEntries),
      derived: ["Aline Fixture"],
      configured: [],
      allowlist,
      cwd: repo,
    });
  const derivedPin = {
    path: "fixture.md",
    id: FINDING_CLASSES.DERIVED,
    count: 2,
  };
  const homePin = {
    path: "fixture.md",
    id: FINDING_CLASSES.HOME_PATH,
    count: 1,
  };
  assert.deepEqual(scan([derivedPin, homePin]), []);
  assert.deepEqual(
    classesOf(scan([{ ...derivedPin, count: 1 }, homePin])).sort(),
    [FINDING_CLASSES.DERIVED],
  );
  assert.deepEqual(classesOf(scan([derivedPin])), [FINDING_CLASSES.HOME_PATH]);
  assert.deepEqual(classesOf(scan([{ ...homePin, count: 1 }])), [FINDING_CLASSES.DERIVED]);
  assert.deepEqual(classesOf(scan([])).sort(), [
    FINDING_CLASSES.DERIVED,
    FINDING_CLASSES.HOME_PATH,
  ].sort());
});

test("an unchanged count cannot hide an occurrence on an added line", () => {
  const layerA = [];
  const layerB = scanRecords([creditRecord("Aline Fixture moved here")], {
    derived: ["Aline Fixture"],
    configured: [],
    allowlist,
  });
  assert.deepEqual(layerA, [], "the whole-file count can remain at its pin");
  assert.deepEqual(classesOf(layerB), [FINDING_CLASSES.DERIVED]);
});

test("a deleted-only file contributes no whole-file finding", () => {
  assert.deepEqual(
    scanWholeFiles({
      files: [],
      head: "HEAD",
      baseline: baseline(),
      derived: ["fixtureowner"],
      configured: [],
      allowlist,
      cwd: REPO,
    }),
    [],
  );
});

test("baseline invariant reports stale pins and a newly configured class", () => {
  const stale = { path: "fixture.md", id: FINDING_CLASSES.DERIVED, count: 2 };
  const configured = { path: "other.md", id: FINDING_CLASSES.CONFIGURED, count: 1 };
  assert.deepEqual(
    compareCiBaseline(baseline([stale]), [{ ...stale, count: 1 }, configured]).map(
      ({ kind, path, id }) => ({ kind, path, id }),
    ),
    [
      { kind: "stale-pin", path: "fixture.md", id: FINDING_CLASSES.DERIVED },
      { kind: "unpinned-configured", path: "other.md", id: FINDING_CLASSES.CONFIGURED },
    ],
  );
});
