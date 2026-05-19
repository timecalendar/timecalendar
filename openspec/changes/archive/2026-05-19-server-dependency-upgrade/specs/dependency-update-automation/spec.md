## ADDED Requirements

### Requirement: Repository-wide automated dependency updates

The repository SHALL carry a committed Dependabot configuration at
`.github/dependabot.yml` that tracks every package ecosystem present in the
repo, so dependency drift surfaces automatically as pull requests rather than
accumulating until a manual audit.

The configuration SHALL cover all five ecosystems: the `server/` npm
workspace, the `web/` npm workspace, the `openapi/javascript` npm workspace,
the `openapi/dart` pub workspace, and GitHub Actions. Each entry SHALL run on
a recurring (weekly) schedule, SHALL bound open-PR noise with an
`open-pull-requests-limit`, and SHALL group related updates so they arrive as
a single pull request.

#### Scenario: Every ecosystem is tracked

- **WHEN** `.github/dependabot.yml` is reviewed
- **THEN** it is a `version: 2` config with one `updates:` entry for each of:
  `npm` at `/server`, `npm` at `/web`, `npm` at `/openapi/javascript`, `pub`
  at `/openapi/dart`, and `github-actions` at `/`
- **AND** every entry declares a weekly `schedule`, an
  `open-pull-requests-limit`, and a `groups:` block

#### Scenario: The config introduces no dependency change

- **WHEN** the change's diff is reviewed
- **THEN** `.github/dependabot.yml` is the only automation-config file added
- **AND** it does not itself bump any dependency — it only configures the
  recurring update mechanism
