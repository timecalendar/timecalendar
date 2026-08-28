import { act, renderHook, waitFor } from "@testing-library/react-native"

import { remove } from "@/storage"

import { useSourceHealthSnapshot } from "./hooks"
import { replaceSourceHealthSnapshot } from "./store"
import { SOURCE_HEALTH_KEY } from "./types"

afterEach(() => remove(SOURCE_HEALTH_KEY))

it("reactively reads a replaced source-health snapshot", async () => {
  const { result } = await renderHook(() => useSourceHealthSnapshot())
  expect(result.current).toEqual({})

  act(() => {
    replaceSourceHealthSnapshot({
      calendar: {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })
  })

  await waitFor(() => expect(result.current.calendar?.status).toBe("stale"))
})
