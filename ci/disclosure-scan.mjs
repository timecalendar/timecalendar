#!/usr/bin/env node
// Fails a branch that would publish an identifying string into this public
// repository: a personal name, login, address, or home directory.
//
// The rule this enforces is already prose in every contributor's instructions,
// and prose is what failed — on a change about identity or authentication the
// accurate observation and the forbidden string are the same text, so the
// sentence reads as correct to every reviewer, because it is correct. This runs
// the check mechanically instead.
//
// Three pattern sources, layered. Each is independent; a later one being absent
// never disables an earlier one.
//
//   1. derived    — the repository's own commit authors. Those identities are
//                   already public in the history, so reading them discloses
//                   nothing and configuring nothing. Always on.
//   2. structural — shapes rather than values: an address, a bare profile URL,
//                   a home directory, a co-author trailer. Always on.
//   3. configured — the optional DISCLOSURE_PATTERNS secret, for strings this
//                   repository's history does not contain. One line per entry:
//                   a regular expression, optionally followed by ` :: ` and a
//                   probe string it must match. Absent by design in forks and
//                   on the first run; its absence degrades coverage and must
//                   never fail the job, while an entry that does not compile,
//                   or that fails its own probe, fails it closed — a pattern
//                   list that half-loads is the failure mode that looks green.
//
// Two properties matter as much as the matching:
//
//   * No denylist is committed. A denylist is a list of the exact strings that
//     must not be published, so a copy of it inside the repository it guards
//     publishes them. Patterns are derived at run time or injected as a secret.
//     The committed file next to this one is an ALLOWLIST — the inverse — and
//     may only ever hold strings that are already safe to publish.
//   * No finding ever prints what it matched. Actions logs on a public
//     repository are public, so a gate that echoes the offending line to help
//     the author republishes the string it just caught, somewhere nobody thinks
//     to scrub. Findings carry a location and a class, and nothing else.
//
// Usage: node ci/disclosure-scan.mjs [--base <ref>] [--head <ref>]

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = resolve(HERE, "disclosure-allowlist.json");

// A derived token shorter than this is a word before it is an identity, and
// would match prose everywhere.
const MIN_DERIVED_LENGTH = 4;
const MIN_CONFIGURED_LENGTH = 3;

export const FINDING_CLASSES = {
  DERIVED: "derived-identity",
  CONFIGURED: "configured-pattern",
  EMAIL: "email-address",
  PROFILE_URL: "profile-url",
  HOME_PATH: "home-directory-path",
  CO_AUTHOR: "co-author-trailer",
};

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

export function loadAllowlist(path = ALLOWLIST_PATH) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const set = (key) =>
    new Set((raw[key] ?? []).map((value) => String(value).toLowerCase()));
  return {
    excludedPaths: raw.excludedPaths ?? [],
    creditPaths: raw.creditPaths ?? [],
    platformIdentityEmailDomains: set("platformIdentityEmailDomains"),
    nonIdentifyingMailDomains: set("nonIdentifyingMailDomains"),
    emailDomains: set("emailDomains"),
    emailLocalParts: set("emailLocalParts"),
    fileExtensionTlds: set("fileExtensionTlds"),
    githubLogins: set("githubLogins"),
    homePathPrefixes: set("homePathPrefixes"),
    applicationIdLabels: set("applicationIdLabels"),
  };
}

// `example.test` is allowed by the bare `test` entry, and `mail.example.com` by
// `example.com`, so the allowlist stays short.
function domainIsAllowed(domain, allowed) {
  const labels = domain.toLowerCase().split(".");
  for (let i = 0; i < labels.length; i += 1) {
    if (allowed.has(labels.slice(i).join("."))) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Layer 1 — patterns derived from the repository's own history
// ---------------------------------------------------------------------------

// Dropping `[bot]` names is not sufficient. The forge's own CI identity commits
// under a human-shaped display name that occurs legitimately in workflows and
// documentation; deriving it would fail nearly every change. Platform
// identities go by email domain.
export function isPlatformIdentity({ name, email }, allowlist) {
  if (/\[bot\]/i.test(name) || /\[bot\]/i.test(email)) return true;
  const domain = email.split("@")[1];
  if (!domain) return false;
  return domainIsAllowed(domain, allowlist.platformIdentityEmailDomains);
}

export function deriveIdentityPatterns(identities, allowlist) {
  const tokens = new Set();
  for (const identity of identities) {
    if (isPlatformIdentity(identity, allowlist)) continue;

    if (identity.name) tokens.add(identity.name);
    if (!identity.email) continue;
    tokens.add(identity.email);

    const [localPart, domain] = identity.email.split("@");
    // A `NNNNN+login@users.noreply.github.com` local part is the login itself.
    if (localPart) tokens.add(localPart.replace(/^\d+\+/, ""));
    if (!domain) continue;

    // A consumer mail provider identifies nobody. A domain outside that set is
    // as identifying as the address, and its second-level label is usually the
    // login too — which is what turns a personal repository URL into a hit.
    if (domainIsAllowed(domain, allowlist.nonIdentifyingMailDomains)) continue;
    tokens.add(domain);
    const label = domain.split(".").slice(-2, -1)[0];
    if (label) tokens.add(label);
  }

  return dedupeTokens(tokens, MIN_DERIVED_LENGTH);
}

function dedupeTokens(tokens, minLength) {
  const seen = new Set();
  const out = [];
  for (const token of tokens) {
    const value = String(token).trim();
    if (value.length < minLength) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Layer 3 — the optional injected secret
// ---------------------------------------------------------------------------

// Each line is `<pattern>` or `<pattern> :: <probe>`: an expression, and a
// string that expression must match. The probe is a positive control — it is
// what tells a run apart from one where the entry parsed, compiled, reported
// itself loaded, and matches nothing. Every count-shaped signal reads the same
// in both states, which is this gate's own founding defect.
//
// Space-two-colon-space, chosen by measuring collisions against the live
// patterns and a corpus of regex idioms rather than by taste: a comma collides
// with 5 of 16 live patterns, a bare two-colon once in the corpus, and the
// padded form not at all. It is also typeable in a browser textarea, which a
// tab is not.
const PROBE_DELIMITER = " :: ";

// Split on the FIRST delimiter, not the last. A pattern that matches
// delimiter-bearing text necessarily carries a delimiter-bearing probe, so
// splitting last cuts inside the probe and mis-assigns both columns. Splitting
// first puts the constraint on the pattern column, which has an escape hatch
// the probe does not: a pattern needing to match that text writes one colon as
// a bracketed class, which is regex-equivalent and delimiter-free.
export function parseConfiguredPatterns(raw) {
  if (!raw) return [];
  const entries = [];
  const seen = new Set();
  // One line per element, not one run of newlines: a blank line must not shift
  // the numbering, because that number is the only handle the operator gets on
  // an entry nobody can read back. A comma cannot separate entries either —
  // `{2,}`, `{4,}` and every character class contain one, so a comma-splitting
  // parser shreds a single pasted expression into fragments.
  raw.split(/\r?\n/).forEach((value, index) => {
    const line = value.trim();
    const at = line.indexOf(PROBE_DELIMITER);
    const pattern = at === -1 ? line : line.slice(0, at);
    const probe = at === -1 ? null : line.slice(at + PROBE_DELIMITER.length);
    // The guard belongs to the pattern column: applied to the joined line, a
    // two-character expression with a long probe slips past the check that
    // exists to reject it.
    if (pattern.length < MIN_CONFIGURED_LENGTH) return;
    // Dedupe on the pattern too. One expression with two probes is one entry.
    const key = pattern.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ pattern, probe, line: index + 1 });
  });
  return entries;
}

// Configured entries are compiled as regular expressions, not escaped into
// literals: the secret exists for shapes the history cannot yield, and a
// literal-only layer reports itself loaded while matching nothing.
export function compileConfiguredPattern(source) {
  return new RegExp(source, "giu");
}

// Returns each entry with its compiled expression, and the line numbers that
// failed to compile. The caller fails the job on a non-empty `invalid`; it must
// never print the entry itself, because the entry is the secret and this log is
// public.
export function compileConfiguredPatterns(entries) {
  const compiled = [];
  const invalid = [];
  for (const entry of entries) {
    try {
      compiled.push({ ...entry, regex: compileConfiguredPattern(entry.pattern) });
    } catch {
      invalid.push(entry.line);
    }
  }
  return { compiled, invalid };
}

// Every entry carrying a probe must match it. Parsing, compiling and counting
// all succeed on an entry that matches nothing — a mis-split column, a stale
// value, a lookahead that is one character too greedy — and no log line, and no
// reading of the parser, tells that state apart from a working one. This does.
//
// It is a positive control for one string per entry, not a completeness proof:
// an entry with no probe is unverified, and the caller says so rather than
// implying the layer is armed.
export function selfTestConfigured(compiled) {
  const failed = [];
  let covered = 0;
  for (const entry of compiled) {
    if (entry.probe === null) continue;
    covered += 1;
    entry.regex.lastIndex = 0;
    if (!entry.regex.test(entry.probe)) failed.push(entry.line);
    entry.regex.lastIndex = 0;
  }
  return { covered, failed };
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Word boundaries, so a derived `Aline` does not match `Alineation`, but
// `example.fr` still matches when a quote or bracket follows it.
export function compileLiteralPattern(value) {
  return new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(value)}(?![\\p{L}\\p{N}])`,
    "giu",
  );
}

export function matchesAny(text, compiled) {
  return compiled.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

const DOTTED_TOKEN = /[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const HYPHENATED_TOKEN = /[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g;

function tokenAround(text, index, tokenRe) {
  for (const match of text.matchAll(tokenRe)) {
    if (index >= match.index && index < match.index + match[0].length) {
      return match[0];
    }
  }
  return null;
}

// Some identifiers embed a personal handle and are already published beyond
// this repository: the reverse-DNS application id is the installed identity of
// the shipped app, and the mobile backend project id is fixed at creation and
// sits in committed native config for both platforms. Neither can be renamed
// without shipping a different app, both appear in dozens of files, and
// flagging them would keep the gate permanently red over a string nobody can
// act on.
//
// The two exemptions are deliberately narrow and are defined by *shape*, so
// that this repository never has to name the handle it is excusing. Both
// require our own product label to be one of the components:
//
//   * a reverse-DNS application id — all lowercase, three or more dotted
//     labels, first label the size of a top-level domain;
//   * a hyphenated service id — all lowercase, no dots.
//
// A host name keeps neither shape, so `<personal-domain>` on its own, a
// subdomain of it, an account handle and a personal repository path all stay
// flagged.
export function isExemptPublishedIdentifier(text, index, allowlist) {
  const hasProductLabel = (parts) =>
    parts.some((part) => allowlist.applicationIdLabels.has(part));

  const dotted = tokenAround(text, index, DOTTED_TOKEN);
  if (dotted && dotted === dotted.toLowerCase()) {
    const labels = dotted.split(".");
    if (labels.length >= 3 && labels[0].length <= 3 && hasProductLabel(labels)) {
      return true;
    }
  }

  // Only when the match is not part of a dotted token at all: a hyphenated
  // component inside a host name must not inherit this exemption.
  if (dotted) return false;
  const hyphenated = tokenAround(text, index, HYPHENATED_TOKEN);
  return Boolean(
    hyphenated &&
      hyphenated === hyphenated.toLowerCase() &&
      hasProductLabel(hyphenated.split("-")),
  );
}

// Occurrences, not matching lines. The disclosure surface is table rows and
// prose sentences, which routinely carry two identities on one line; counting
// lines silently halves the true figure, and the remediation "scrub this line"
// then scrubs one of two.
function countUnexemptMatches(text, compiled, allowlist) {
  let count = 0;
  for (const pattern of compiled) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!isExemptPublishedIdentifier(text, match.index, allowlist)) count += 1;
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }
  }
  return count;
}

const EMAIL_RE =
  /(?<![\p{L}\p{N}._%+-])([\p{L}\p{N}._%+'-]+)@([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/giu;
const PROFILE_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9][A-Za-z0-9-]*)/gi;
// Both spellings of a home directory — the second is where macOS puts them,
// and a committed path in that form is as much host layout as the first. The
// optional second group is the first sub-directory, which is what the exempt
// prefixes are matched against.
const HOME_RE =
  /(?<![\p{L}\p{N}_/.-])\/(?:home|Users)\/([A-Za-z0-9._-]+)(\/[A-Za-z0-9._-]+)?/gu;
const CO_AUTHOR_RE = /^\s*co-?authored-by:\s*(.+)$/i;

// Occurrence counts per class. `structuralClasses` is the same answer without
// the counts, for callers that only ask whether a line is clean.
export function structuralCounts(text, allowlist) {
  const counts = new Map();
  const bump = (className) =>
    counts.set(className, (counts.get(className) ?? 0) + 1);

  for (const [, localPart, domain] of text.matchAll(EMAIL_RE)) {
    const tld = domain.split(".").pop().toLowerCase();
    // A pinned version — `setup-helm@v4.3.1`, `react-native@0.81.5` — is
    // email-shaped, and workflows and docs are full of them. A real top-level
    // domain is at least two letters and no digits.
    if (!/^\p{L}{2,}$/u.test(tld)) continue;
    // `logo@2x.png` is email-shaped and is an asset filename.
    if (allowlist.fileExtensionTlds.has(tld)) continue;
    if (allowlist.emailLocalParts.has(localPart.toLowerCase())) continue;
    if (domainIsAllowed(domain, allowlist.emailDomains)) continue;
    bump(FINDING_CLASSES.EMAIL);
  }

  for (const match of text.matchAll(PROFILE_RE)) {
    // Only a *bare* profile URL is a person. Anything with a further path
    // segment is a repository, a release, or a reserved GitHub route, and
    // flagging those would fail on every dependency link we cite.
    const after = text.slice(match.index + match[0].length);
    if (/^[/\w~-]/.test(after)) continue;
    if (allowlist.githubLogins.has(match[1].toLowerCase())) continue;
    bump(FINDING_CLASSES.PROFILE_URL);
  }

  // Exempt by *prefix*, never by account. Allowlisting the account a fleet runs
  // under discards every host path that fleet would realistically leak, which
  // is the whole category; a toolchain install path under a shared account is
  // the narrow, published thing that has to keep passing.
  for (const [, account, sub] of text.matchAll(HOME_RE)) {
    const prefix = account.toLowerCase();
    if (allowlist.homePathPrefixes.has(prefix)) continue;
    if (sub && allowlist.homePathPrefixes.has(prefix + sub.toLowerCase())) continue;
    bump(FINDING_CLASSES.HOME_PATH);
  }

  const trailer = text.match(CO_AUTHOR_RE);
  if (trailer) {
    const address = trailer[1].match(/<([^>]+)>/)?.[1] ?? trailer[1];
    const localPart = address.split("@")[0].trim().toLowerCase();
    if (!allowlist.emailLocalParts.has(localPart)) {
      bump(FINDING_CLASSES.CO_AUTHOR);
    }
  }

  return counts;
}

export function structuralClasses(text, allowlist) {
  return [...structuralCounts(text, allowlist).keys()];
}

// The About screen names the people who built the app and links to their sites
// deliberately, as user-facing product content. Listing those paths is benign —
// it names a location, never a person — and is far safer than the alternative,
// which would be putting the names themselves in an allowlist in a public
// repository. An entry matches a file or a directory prefix.
export function isCreditPath(file, allowlist) {
  return allowlist.creditPaths.some(
    (prefix) => file === prefix || file.startsWith(prefix),
  );
}

// A record is `{ source, location, text }`. `derived` is a list of literal
// strings; `configured` is a list of already-compiled regular expressions,
// because compiling one can fail and that failure has to reach the exit code
// rather than a scan loop.
//
// The returned findings deliberately carry no excerpt, no matched substring and
// no pattern — only where, which class, and how many — because this output is
// published.
export function scanRecords(records, { derived, configured, allowlist }) {
  const derivedPatterns = derived.map(compileLiteralPattern);
  const findings = [];
  const byKey = new Map();

  const add = (record, className, count) => {
    if (count < 1) return;
    const key = `${record.source}\0${record.location}\0${className}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += count;
      return;
    }
    const finding = {
      source: record.source,
      location: record.location,
      file: record.file,
      line: record.line,
      class: className,
      count,
    };
    byKey.set(key, finding);
    findings.push(finding);
  };

  for (const record of records) {
    // On the credit surface an identity is the product, not a leak; the
    // structural rules still run there.
    const credited = record.file !== null && isCreditPath(record.file, allowlist);
    if (!credited) {
      add(
        record,
        FINDING_CLASSES.DERIVED,
        countUnexemptMatches(record.text, derivedPatterns, allowlist),
      );
      add(
        record,
        FINDING_CLASSES.CONFIGURED,
        countUnexemptMatches(record.text, configured, allowlist),
      );
    }
    for (const [className, count] of structuralCounts(record.text, allowlist)) {
      add(record, className, count);
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Collecting what the branch would publish
// ---------------------------------------------------------------------------

const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

export function readIdentities(range, cwd) {
  const out = git(["log", "--no-merges", "--format=%an%x00%ae", range], cwd);
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, email] = line.split("\0");
      return { name: name ?? "", email: email ?? "" };
    });
}

// `--unified=0` so every `+` line is an addition, never context. Only added
// lines are scanned: what is already in the history is already published, and
// re-flagging it would make the gate unusable on the day it merges.
export function parseAddedLines(diff) {
  const records = [];
  let file = null;
  let line = 0;
  let inHunk = false;
  let afterFromHeader = false;

  for (const raw of diff.split("\n")) {
    if (raw.startsWith("diff --git ")) {
      file = null;
      inHunk = false;
      afterFromHeader = false;
      continue;
    }

    // `+++ ` is a file header only where one can occur: outside a hunk, and
    // directly after the matching `--- ` line. Inside a hunk it is an added
    // line whose own content begins with `++ `, and treating that as a header
    // both skips the line and re-points every following line at the wrong file.
    const isToHeader = !inHunk && afterFromHeader && raw.startsWith("+++ ");
    afterFromHeader = !inHunk && raw.startsWith("--- ");
    if (isToHeader) {
      const path = raw.slice(4);
      file = path === "/dev/null" ? null : path.replace(/^b\//, "");
      continue;
    }

    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      inHunk = true;
      line = Number(hunk[1]);
      continue;
    }

    if (inHunk && raw.startsWith("+")) {
      if (file) {
        records.push({
          source: "diff",
          file,
          line,
          location: `${file}:${line}`,
          text: raw.slice(1),
        });
      }
      line += 1;
    }
  }
  return records;
}

export function collectRecords({ base, head, allowlist, cwd }) {
  const pathspec = ["--", ".", ...allowlist.excludedPaths];
  const range = `${base}..${head}`;
  const records = [];

  records.push(
    ...parseAddedLines(
      git(["diff", "--no-color", "--unified=0", "-M", range, ...pathspec], cwd),
    ),
  );

  // A pure rename discloses with no content change at all.
  const nameStatus = git(
    ["diff", "--no-color", "--name-status", "-M", range, ...pathspec],
    cwd,
  );
  for (const raw of nameStatus.split("\n").filter(Boolean)) {
    const parts = raw.split("\t");
    const path = parts[parts.length - 1];
    if (parts[0].startsWith("D")) continue;
    records.push({
      source: "path",
      file: path,
      line: null,
      location: path,
      text: path,
    });
  }

  // Commit messages are published with the commits.
  const log = git(["log", "--no-color", "--format=%H%x00%B%x1e", range], cwd);
  for (const entry of log.split("\x1e")) {
    const [sha, body] = entry.replace(/^\n+/, "").split("\0");
    if (!sha || body === undefined) continue;
    body.split("\n").forEach((text, index) => {
      records.push({
        source: "commit-message",
        file: null,
        line: null,
        location: `commit ${sha.slice(0, 12)} message line ${index + 1}`,
        text,
      });
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base") options.base = argv[++i];
    else if (argv[i] === "--head") options.head = argv[++i];
    else if (argv[i] === "--cwd") options.cwd = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return options;
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv);
  const cwd = options.cwd ?? process.cwd();
  const head = options.head ?? env.DISCLOSURE_HEAD ?? "HEAD";
  const baseRef = options.base ?? env.DISCLOSURE_BASE ?? "origin/main";
  const allowlist = loadAllowlist();

  // Compiled before anything else: a half-loaded pattern list is the failure
  // that looks green, so it must not be able to reach the scan at all.
  const configuredEntries = parseConfiguredPatterns(env.DISCLOSURE_PATTERNS);
  const { compiled, invalid } = compileConfiguredPatterns(configuredEntries);
  if (invalid.length) {
    for (const entryLine of invalid) {
      console.error(
        `::error::disclosure-scan: DISCLOSURE_PATTERNS entry ${entryLine} is not a valid regular expression. ` +
          "The entry itself is never printed — this log is public. One expression per line; a comma does not separate entries.",
      );
    }
    console.error(
      `disclosure-scan: failing closed on ${invalid.length} uncompilable pattern(s) rather than scanning without them.`,
    );
    return 2;
  }

  const selfTest = selfTestConfigured(compiled);
  const configured = compiled.map((entry) => entry.regex);

  let base;
  try {
    base = git(["merge-base", baseRef, head], cwd).trim();
  } catch {
    // Fail closed: a shallow clone silently scanning nothing is worse than a
    // red job, because it reports success at preventing the thing it skipped.
    console.error(
      `::error::disclosure-scan: cannot resolve a merge base between ${baseRef} and ${head}. ` +
        "Check out with fetch-depth: 0.",
    );
    return 2;
  }

  const derived = deriveIdentityPatterns(readIdentities(head, cwd), allowlist);

  // Counts only — a census that printed values would be the leak. This line is
  // also how the secret is verified: nobody can read it back through the API
  // with a metadata-scoped token, but every run states it. It reports entries
  // parsed, entries compiled, and the self-test — because entries-parsed alone
  // prints identically whether those entries match anything or nothing, and a
  // check that cannot fail is not a check.
  console.log(
    `disclosure-scan: patterns — derived: ${derived.length} (literal), structural: on, ` +
      `configured secret: ${
        configuredEntries.length
          ? `present, ${configuredEntries.length} entries, ${compiled.length} compiled, ` +
            `self-test ${selfTest.covered - selfTest.failed.length}/${compiled.length}`
          : "absent"
      }`,
  );
  if (!configuredEntries.length) {
    console.log(
      "disclosure-scan: DISCLOSURE_PATTERNS is not set; derived and structural layers still apply.",
    );
  } else if (selfTest.covered < compiled.length) {
    // Say what is not covered rather than let the count imply it is. A
    // probeless entry that matches nothing is invisible to every other signal
    // this job emits.
    console.log(
      `disclosure-scan: ${compiled.length - selfTest.covered} configured entry/entries carry no probe and are unverified; ` +
        "a shredded or uncompilable entry is detected, a live-looking dead one is not.",
    );
  }

  if (selfTest.failed.length) {
    for (const entryLine of selfTest.failed) {
      console.error(
        `::error::disclosure-scan: DISCLOSURE_PATTERNS entry ${entryLine} does not match its own probe. ` +
          "Neither the entry nor its probe is ever printed — this log is public, and a probe is by construction " +
          "a string that matches a forbidden pattern.",
      );
    }
    console.error(
      `disclosure-scan: failing closed on ${selfTest.failed.length} configured entry/entries that match nothing they claim to.`,
    );
    return 2;
  }

  const records = collectRecords({ base, head, allowlist, cwd });
  console.log(
    `disclosure-scan: ${records.length} added line(s), path(s) and commit message line(s) since ${base.slice(0, 12)}`,
  );

  const findings = scanRecords(records, { derived, configured, allowlist });
  if (!findings.length) {
    console.log("disclosure-scan: no findings.");
    return 0;
  }

  for (const finding of findings) {
    const where = finding.file
      ? `file=${finding.file}${finding.line ? `,line=${finding.line}` : ""}`
      : "";
    console.log(
      `::error ${where}::disclosure-scan: ${finding.location} — ${finding.count} occurrence(s) of ${finding.class}`,
    );
  }
  const occurrences = findings.reduce((total, f) => total + f.count, 0);
  console.error(
    `disclosure-scan: ${findings.length} finding(s), ${occurrences} occurrence(s). ` +
      "The match itself is never printed — this log is public. " +
      "Open the location locally to see it, and scrub every occurrence the count reports, not the first one you find. " +
      "If it is benign, add the domain, login or path prefix to ci/disclosure-allowlist.json.",
  );
  return 1;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) process.exit(main());
