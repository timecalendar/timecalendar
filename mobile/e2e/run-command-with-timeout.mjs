#!/usr/bin/env node

import { spawn } from "node:child_process"
import fs from "node:fs"

const [timeoutSecondsRaw, logPath, separator, command, ...args] =
  process.argv.slice(2)
const timeoutSeconds = Number(timeoutSecondsRaw)

if (
  !Number.isInteger(timeoutSeconds) ||
  timeoutSeconds < 1 ||
  !logPath ||
  separator !== "--" ||
  !command
) {
  console.error(
    "usage: run-command-with-timeout.mjs <seconds> <log-path> -- <command> [args...]",
  )
  process.exitCode = 2
} else {
  const log = fs.createWriteStream(logPath, { flags: "w" })
  const child = spawn(command, args, {
    detached: process.platform !== "win32",
    stdio: ["inherit", "pipe", "pipe"],
  })
  let timedOut = false

  const forward = (chunk) => {
    process.stdout.write(chunk)
    log.write(chunk)
  }
  child.stdout.on("data", forward)
  child.stderr.on("data", forward)

  const killChildGroup = (signal) => {
    try {
      if (process.platform === "win32") child.kill(signal)
      else process.kill(-child.pid, signal)
    } catch (error) {
      if (error.code !== "ESRCH") throw error
    }
  }

  const timeout = setTimeout(() => {
    timedOut = true
    const message = `[run-command-with-timeout] command exceeded ${timeoutSeconds}s; terminating process group\n`
    process.stderr.write(message)
    log.write(message)
    killChildGroup("SIGTERM")
  }, timeoutSeconds * 1000)

  const forceKill = setTimeout(
    () => {
      if (timedOut) killChildGroup("SIGKILL")
    },
    timeoutSeconds * 1000 + 5000,
  )

  child.on("error", (error) => {
    const message = `[run-command-with-timeout] could not start command: ${error.message}\n`
    process.stderr.write(message)
    log.write(message)
  })

  child.on("close", (code) => {
    clearTimeout(timeout)
    clearTimeout(forceKill)
    log.end(() => {
      process.exitCode = timedOut ? 124 : (code ?? 1)
    })
  })
}
