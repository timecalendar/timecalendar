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
//                   repository's history does not contain. Absent by design in
//                   forks and on the first run; its absence degrades coverage
//                   and must never fail the job.
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
    homeUsers: set("homeUsers"),
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

export function parseConfiguredPatterns(raw) {
  if (!raw) return [];
  return dedupeTokens(raw.split(/[\r\n,]+/), MIN_CONFIGURED_LENGTH);
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

function hasUnexemptMatch(text, compiled, allowlist) {
  return compiled.some((pattern) => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!isExemptPublishedIdentifier(text, match.index, allowlist)) return true;
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }
    return false;
  });
}

const EMAIL_RE =
  /(?<![\p{L}\p{N}._%+-])([\p{L}\p{N}._%+'-]+)@([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/giu;
const PROFILE_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9][A-Za-z0-9-]*)/gi;
const HOME_RE = /(?<![\p{L}\p{N}_/.-])\/home\/([A-Za-z0-9._-]+)/gu;
const CO_AUTHOR_RE = /^\s*co-?authored-by:\s*(.+)$/i;

export function structuralClasses(text, allowlist) {
  const classes = new Set();

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
    classes.add(FINDING_CLASSES.EMAIL);
  }

  for (const match of text.matchAll(PROFILE_RE)) {
    // Only a *bare* profile URL is a person. Anything with a further path
    // segment is a repository, a release, or a reserved GitHub route, and
    // flagging those would fail on every dependency link we cite.
    const after = text.slice(match.index + match[0].length);
    if (/^[/\w~-]/.test(after)) continue;
    if (allowlist.githubLogins.has(match[1].toLowerCase())) continue;
    classes.add(FINDING_CLASSES.PROFILE_URL);
  }

  for (const [, user] of text.matchAll(HOME_RE)) {
    if (allowlist.homeUsers.has(user.toLowerCase())) continue;
    classes.add(FINDING_CLASSES.HOME_PATH);
  }

  const trailer = text.match(CO_AUTHOR_RE);
  if (trailer) {
    const address = trailer[1].match(/<([^>]+)>/)?.[1] ?? trailer[1];
    const localPart = address.split("@")[0].trim().toLowerCase();
    if (!allowlist.emailLocalParts.has(localPart)) {
      classes.add(FINDING_CLASSES.CO_AUTHOR);
    }
  }

  return [...classes];
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

// A record is `{ source, location, text }`. The returned findings deliberately
// carry no excerpt, no matched substring and no pattern — only where and which
// class — because this output is published.
export function scanRecords(records, { derived, configured, allowlist }) {
  const derivedPatterns = derived.map(compileLiteralPattern);
  const configuredPatterns = configured.map(compileLiteralPattern);
  const findings = [];
  const seen = new Set();

  const add = (record, className) => {
    const key = `${record.source}\0${record.location}\0${className}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({
      source: record.source,
      location: record.location,
      file: record.file,
      line: record.line,
      class: className,
    });
  };

  for (const record of records) {
    // On the credit surface an identity is the product, not a leak; the
    // structural rules still run there.
    const credited = record.file !== null && isCreditPath(record.file, allowlist);
    if (!credited && hasUnexemptMatch(record.text, derivedPatterns, allowlist)) {
      add(record, FINDING_CLASSES.DERIVED);
    }
    if (!credited && hasUnexemptMatch(record.text, configuredPatterns, allowlist)) {
      add(record, FINDING_CLASSES.CONFIGURED);
    }
    for (const className of structuralClasses(record.text, allowlist)) {
      add(record, className);
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
  for (const raw of diff.split("\n")) {
    if (raw.startsWith("+++ ")) {
      const path = raw.slice(4);
      file = path === "/dev/null" ? null : path.replace(/^b\//, "");
      continue;
    }
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }
    if (raw.startsWith("+") && !raw.startsWith("+++")) {
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
  const configured = parseConfiguredPatterns(env.DISCLOSURE_PATTERNS);

  // Counts only — a census that printed values would be the leak. This line is
  // also how the presence of the secret is verified: nobody can read it back
  // through the API with a metadata-scoped token, but every run states it.
  console.log(
    `disclosure-scan: patterns — derived: ${derived.length}, structural: on, ` +
      `configured secret: ${configured.length ? `present (${configured.length})` : "absent"}`,
  );
  if (!configured.length) {
    console.log(
      "disclosure-scan: DISCLOSURE_PATTERNS is not set; derived and structural layers still apply.",
    );
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
      `::error ${where}::disclosure-scan: ${finding.location} — matched ${finding.class}`,
    );
  }
  console.error(
    `disclosure-scan: ${findings.length} finding(s). The match itself is never printed — this log is public. ` +
      "Open the location locally to see it. If it is benign, add the domain, login or account name to ci/disclosure-allowlist.json.",
  );
  return 1;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) process.exit(main());
