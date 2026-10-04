#!/usr/bin/env node
const fs = require("node:fs")
const path = require("node:path")
const WebSocket = require(path.resolve("mobile/node_modules/ws"))

async function main() {
  const [selector, expression, output] = process.argv.slice(2)
  if (!selector || !expression) {
    throw new Error("Usage from repo root: node inspect-runtime.cjs TARGET EXPRESSION [OUTPUT]")
  }
  const targets = await (await fetch("http://127.0.0.1:8086/json/list")).json()
  const matches = targets.filter(
    (target) => target.appId === "fr.samuelprak.timecalendar" && target.title.includes(selector),
  )
  if (matches.length !== 1) throw new Error("Expected exactly one production-identity local target")
  const endpoint = new URL(matches[0].webSocketDebuggerUrl)
  if (endpoint.protocol !== "ws:" || endpoint.host !== "127.0.0.1:8086") {
    throw new Error("Inspector endpoint must stay on the local rehearsal Metro server")
  }
  const result = await new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint, { origin: "http://127.0.0.1:8086" })
    const timer = setTimeout(() => {
      socket.terminate()
      reject(new Error("Local inspector timed out"))
    }, 25000)
    socket.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    socket.on("open", () => {
      socket.send(JSON.stringify({ id: 1, method: "Runtime.enable" }))
      socket.send(JSON.stringify({ id: 2, method: "Debugger.enable" }))
      socket.send(JSON.stringify({
        id: 3,
        method: "Runtime.evaluate",
        params: { expression, returnByValue: true, awaitPromise: true },
      }))
    })
    socket.on("message", (raw) => {
      const message = JSON.parse(raw)
      // Runtime events replay app logs, including synthetic tokens; retain only the requested result.
      if (message.id !== 3) return
      clearTimeout(timer)
      socket.close()
      resolve(message)
    })
  })
  const serialized = JSON.stringify(result, null, 2) + "\n"
  if (output) fs.writeFileSync(output, serialized)
  process.stdout.write(serialized)
  if (result.error || result.result?.exceptionDetails) process.exitCode = 1
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
