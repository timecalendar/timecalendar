#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const scriptRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));
const wrapper = join(scriptRoot, "bin", "server-compose.sh");

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

const currentRoot = realpathSync(run("git", ["rev-parse", "--show-toplevel"], scriptRoot));
const commonDir = realpathSync(run("git", ["rev-parse", "--git-common-dir"], scriptRoot));
const mainRoot = realpathSync(join(commonDir, ".."));
const listedRoots = run("git", ["worktree", "list", "--porcelain"], scriptRoot)
  .split("\n")
  .filter((line) => line.startsWith("worktree "))
  .map((line) => realpathSync(line.slice("worktree ".length)));
const secondRoot = [currentRoot, ...listedRoots].find((root) => root !== mainRoot);

assert.ok(secondRoot, "verification needs the main checkout and one linked worktree");

const roots = [mainRoot, secondRoot];
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
