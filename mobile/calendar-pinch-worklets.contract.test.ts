/// <reference types="node" />
import { execFileSync } from "node:child_process"
import { join } from "node:path"

it("keeps compiled pinch worklets reactive and visible geometry invariant through native settlement", () => {
  // A fresh Node process avoids Jest's Reanimated mock and test-mode Babel.
  // The harness uses Expo's native compiler and the installed mapper registry.
  try {
    execFileSync(
      process.execPath,
      [
        "--test",
        join(
          __dirname,
          "scripts/test-support/calendar-pinch-worklets.test.cjs",
        ),
      ],
      { cwd: __dirname, encoding: "utf8", stdio: "pipe" },
    )
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string }
    throw new Error(`${failure.stdout ?? ""}\n${failure.stderr ?? ""}`, {
      cause: error,
    })
  }
})
