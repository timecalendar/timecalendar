#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, realpathSync } from "node:fs";

const scriptRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));
const wrapper = join(scriptRoot, "bin", "server-compose.sh");
const setup = join(scriptRoot, "bin", "setup-dev.sh");
const capabilitySpec = join(
  scriptRoot,
  "openspec",
  "specs",
  "server-compose-development-environment",
  "spec.md",
);
const handbook = join(scriptRoot, "docs", "agent-dev-environment.md");

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing contract section: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing contract section boundary: ${end}`);
  return source.slice(startIndex, endIndex);
}

function assertDiagnosticContract() {
  const wrapperSource = readFileSync(wrapper, "utf8");
  const specSource = readFileSync(capabilitySpec, "utf8");
  const handbookSource = readFileSync(handbook, "utf8");

  const selectedConfiguration = section(
    specSource,
    "### Requirement: Selected configuration is diagnosable",
    "### Requirement: Static isolation verification",
  );
  const unreachableProxy = section(
    specSource,
    "### Requirement: Unreachable TLS proxy is attributed to the nginx container",
    "### Requirement: Local TLS material is provisioned, never committed",
  );
  const devSetup = section(
    handbookSource,
    "## 4. Dev-environment setup",
    "### Firebase",
  );

  for (const contract of [selectedConfiguration, unreachableProxy, devSetup]) {
    assert.match(contract, /create, start, stop, restart,\s+remove/);
    assert.match(contract, /Docker\s+resource/);
    assert.match(contract, /provision or renew/);
    assert.match(contract, /checkout-local/);
  }
  for (const contract of [selectedConfiguration, devSetup]) {
    assert.match(contract, /project-name/);
    assert.match(contract, /--compose-config|configuration-only output/);
    assert.match(contract, /write(?:s)?\s+no(?:thing|\s+file)/);
    assert.match(contract, /contact(?:s)? no service/);
  }
  assert.match(devSetup, /gitignored and untracked/);
  assert.match(devSetup, /ci\/certificates\/cert\.pem/);
  assert.match(devSetup, /key\.pem/);

  const projectNameExit = wrapperSource.indexOf('if [ "${1:-}" = "project-name" ]');
  const certificateGuard = wrapperSource.indexOf(
    '"$repo_root/ci/certificates/ensure-certificates.sh"',
  );
  const composeExec = wrapperSource.indexOf("exec docker compose");
  assert.ok(projectNameExit >= 0, "project-name must retain its early-exit branch");
  assert.ok(certificateGuard > projectNameExit, "certificate guard must follow project-name");
  assert.ok(composeExec > certificateGuard, "Compose exec must follow the certificate guard");
}

function run(command, args, cwd, env = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  }).trim();
}

function cleanEnvironment(overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.COMPOSE_PROJECT_NAME;
  delete env.TIMECALENDAR_TLS_PORT;
  delete env.TIMECALENDAR_POSTGRES_PORT;
  delete env.TIMECALENDAR_REDIS_PORT;
  return env;
}

function selectedProject(root) {
  return execFileSync(wrapper, ["project-name"], {
    cwd: root,
    encoding: "utf8",
    env: cleanEnvironment(),
  }).trim();
}

function render(project, ports, extraFiles = [], services = []) {
  const args = [];
  for (const file of extraFiles) {
    args.push("--file", file);
  }
  args.push("config", "--format", "json", ...services);

  const env = cleanEnvironment();
  env.COMPOSE_PROJECT_NAME = project;
  if (ports) {
    env.TIMECALENDAR_TLS_PORT = String(ports.tls);
    env.TIMECALENDAR_POSTGRES_PORT = String(ports.postgres);
    env.TIMECALENDAR_REDIS_PORT = String(ports.redis);
  }

  return JSON.parse(
    execFileSync(wrapper, args, {
      cwd: scriptRoot,
      encoding: "utf8",
      env,
    }),
  );
}

function publishedPort(model, service, target) {
  const port = model.services[service].ports.find((candidate) => candidate.target === target);
  assert.ok(port, `${service} must publish container port ${target}`);
  return Number(port.published);
}

// Compose renders extra_hosts either as "host=address" entries or as a map,
// depending on its version. Normalize both to "host:address".
function hostMappings(definition) {
  const extraHosts = definition.extra_hosts ?? [];
  return Array.isArray(extraHosts)
    ? extraHosts.map((entry) => entry.replace("=", ":"))
    : Object.entries(extraHosts).map(([host, address]) => `${host}:${address}`);
}

function assertScopedModel(model, project, ports) {
  assert.equal(model.name, project);
  assert.equal(model.networks.default.name, `${project}_default`);
  assert.equal(model.volumes.postgres_data.name, `${project}_postgres_data`);
  assert.equal(model.volumes.redis_data.name, `${project}_redis_data`);

  for (const [service, definition] of Object.entries(model.services)) {
    assert.equal(
      Object.hasOwn(definition, "container_name"),
      false,
      `${service} must retain Compose-generated container naming`,
    );

    const mapsHostGateway = hostMappings(definition).includes("host.docker.internal:host-gateway");
    if (service === "nginx") {
      assert.ok(mapsHostGateway, "nginx must map host.docker.internal to the host gateway");
    } else {
      assert.equal(
        mapsHostGateway,
        false,
        `${service} must not map host.docker.internal — it reaches its peers by service name`,
      );
    }
  }

  assert.equal(publishedPort(model, "nginx", 443), ports.tls);
  assert.equal(publishedPort(model, "postgres", 5432), ports.postgres);
  assert.equal(publishedPort(model, "redis", 6379), ports.redis);

  const certificateMount = model.services.nginx.volumes.find(
    (volume) => volume.target === "/etc/nginx/certificates",
  );
  assert.ok(certificateMount, "nginx certificate mount must remain present");
  assert.equal(certificateMount.type, "bind");
  assert.equal(certificateMount.source, join(scriptRoot, "ci", "certificates"));
}

assertDiagnosticContract();

const currentRoot = realpathSync(run("git", ["rev-parse", "--show-toplevel"], scriptRoot));
const commonDir = realpathSync(run("git", ["rev-parse", "--git-common-dir"], scriptRoot));
const mainRoot = realpathSync(join(commonDir, ".."));
const secondRoot =
  currentRoot !== mainRoot
    ? currentRoot
    : run("git", ["worktree", "list", "--porcelain"], scriptRoot)
        .split("\n")
        .find((line) => line.startsWith("worktree ") && line.slice("worktree ".length) !== mainRoot)
        ?.slice("worktree ".length);

assert.ok(secondRoot, "verification needs the main checkout and one linked worktree");

const roots = [mainRoot, realpathSync(secondRoot)];
const projects = roots.map(selectedProject);
assert.equal(projects[0], "server", "the main checkout must preserve project server");
assert.notEqual(projects[0], projects[1], "checkout project names must be distinct");
assert.match(projects[1], /^server-[a-z0-9][a-z0-9_-]*-[0-9a-f]{8}$/);
assert.ok(projects[1].length <= 64, "derived project name must remain bounded");

const portSets = [
  { tls: 41443, postgres: 45432, redis: 46379 },
  { tls: 42443, postgres: 55432, redis: 56379 },
];
const models = projects.map((project, index) => render(project, portSets[index]));
models.forEach((model, index) => assertScopedModel(model, projects[index], portSets[index]));
assertScopedModel(render(projects[1], null), projects[1], {
  tls: 1443,
  postgres: 37291,
  redis: 37292,
});

for (const service of ["nginx", "postgres", "redis"]) {
  assert.notEqual(`${projects[0]}-${service}-1`, `${projects[1]}-${service}-1`);
}

const dependencyModel = render(projects[1], portSets[1], [], ["postgres", "redis"]);
assert.deepEqual(Object.keys(dependencyModel.services).sort(), ["postgres", "redis"]);

const overlay = render(projects[1], portSets[1], [
  join(scriptRoot, "server", "docker-compose.e2e.yml"),
]);
assert.deepEqual(Object.keys(overlay.services).sort(), ["nginx", "postgres", "redis", "server"]);
assert.ok(overlay.services.postgres.healthcheck);
assert.ok(overlay.services.redis.healthcheck);
assert.ok(overlay.services.server.healthcheck);
assert.equal(overlay.services.server.depends_on.postgres.condition, "service_healthy");
assert.equal(overlay.services.server.depends_on.redis.condition, "service_healthy");
assert.equal(
  overlay.services.server.environment.DATABASE_URL,
  "postgres://postgres@postgres:5432/timecalendar_test",
);
assert.equal(overlay.services.server.environment.REDIS_URL, "redis://redis:6379");
assertScopedModel(overlay, projects[1], portSets[1]);

const unreachablePort = 65534;
assert.equal(
  run(setup, ["--http-status", `http://127.0.0.1:${unreachablePort}/`], scriptRoot),
  "000",
  "a failed backend probe must normalize curl's status to exactly 000",
);
assert.equal(
  run(
    setup,
    [
      "--http-status",
      "--cacert",
      join(scriptRoot, "ci", "certificates", "cert.pem"),
      `https://127.0.0.1:${unreachablePort}/`,
    ],
    scriptRoot,
  ),
  "000",
  "a failed TLS probe must normalize curl's status to exactly 000",
);

const evidence = projects.map((project, index) => ({
  root: roots[index],
  project,
  network: models[index].networks.default.name,
  containers: ["nginx", "postgres", "redis"].map((service) => `${project}-${service}-1`),
  volumes: [
    models[index].volumes.postgres_data.name,
    models[index].volumes.redis_data.name,
  ],
  ports: portSets[index],
}));

console.log(JSON.stringify({ evidence, dependencyServices: Object.keys(dependencyModel.services) }, null, 2));
