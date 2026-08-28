import {
  getSessionResetParticipants,
  registerSessionResetParticipant,
  resetSessions,
} from "./session-reset"

it("is intentionally empty while the React Native app has no auth/session store", () => {
  expect(getSessionResetParticipants()).toHaveLength(0)
})

it("runs registered future auth/session participants and supports cleanup", async () => {
  const participant = jest.fn()
  const unregister = registerSessionResetParticipant(participant)

  expect(getSessionResetParticipants()).toHaveLength(1)
  await resetSessions()
  expect(participant).toHaveBeenCalledTimes(1)

  unregister()
  expect(getSessionResetParticipants()).toHaveLength(0)
  unregister()
  expect(getSessionResetParticipants()).toHaveLength(0)
})
