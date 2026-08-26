import { router } from "expo-router"
import { useEffect, useRef } from "react"

import { CHANGELOG_VERSION } from "@/features/changelog/data"
import {
  decideChangelogGate,
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"

export function ChangelogGate() {
  const evaluated = useRef(false)

  useEffect(() => {
    if (evaluated.current) return
    evaluated.current = true

    const decision = decideChangelogGate(getChangelogSeenVersion())
    if (decision.kind === "seedCurrent") {
      setChangelogSeenVersion(CHANGELOG_VERSION)
    } else if (decision.kind === "present") {
      router.push("/changelog-sheet")
    }
  }, [])

  return null
}
