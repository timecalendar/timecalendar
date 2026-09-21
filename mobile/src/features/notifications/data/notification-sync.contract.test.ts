import fs from "node:fs"
import path from "node:path"

const mobileRoot = path.resolve(__dirname, "../../../..")
const notificationsRoot = path.join(mobileRoot, "src/features/notifications")

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(absolute)
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")
      ? [absolute]
      : []
  })
}

it("keeps one root request owner and no screen-owned generated mutation", () => {
  const sources = sourceFiles(notificationsRoot).map((file) => ({
    file,
    content: fs.readFileSync(file, "utf8"),
  }))
  expect(
    sources
      .filter(({ content }) => content.includes("onFcmTokenRefresh"))
      .map(({ file }) => path.relative(mobileRoot, file)),
  ).toEqual(["src/features/notifications/data/registration.ts"])
  expect(
    sources.some(({ content }) =>
      content.includes(
        "useNotificationSubscriptionControllerCreateOrUpdateSubscription",
      ),
    ),
  ).toBe(false)
  expect(
    sources
      .filter(({ content }) =>
        content.includes(
          "notificationSubscriptionControllerCreateOrUpdateSubscription",
        ),
      )
      .map(({ file }) => path.relative(mobileRoot, file)),
  ).toEqual(["src/features/notifications/data/transport.ts"])

  const layout = fs.readFileSync(
    path.join(mobileRoot, "src/app/_layout.tsx"),
    "utf8",
  )
  expect(layout.indexOf("<NotificationRuntime />")).toBeGreaterThan(
    layout.indexOf("<PersistQueryClientProvider"),
  )
})

it("persists only preferences plus dirty and generation notification keys", () => {
  const storage = fs.readFileSync(
    path.join(mobileRoot, "src/storage/index.ts"),
    "utf8",
  )
  const keys = [...storage.matchAll(/"(notifications\.[^"]+)"/g)].map(
    (match) => match[1],
  )
  expect(keys).toEqual([
    "notifications.frequency",
    "notifications.nbDaysAhead",
    "notifications.isActive",
    "notifications.sync.dirty",
    "notifications.sync.generation",
  ])
})
