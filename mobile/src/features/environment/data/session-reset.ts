export type SessionResetParticipant = () => void | Promise<void>

const sessionResetParticipants: SessionResetParticipant[] = []

export function registerSessionResetParticipant(
  participant: SessionResetParticipant,
): () => void {
  sessionResetParticipants.push(participant)
  return () => {
    const index = sessionResetParticipants.indexOf(participant)
    if (index >= 0) sessionResetParticipants.splice(index, 1)
  }
}

export function getSessionResetParticipants(): readonly SessionResetParticipant[] {
  return sessionResetParticipants
}

export async function resetSessions(): Promise<void> {
  for (const participant of sessionResetParticipants) await participant()
}
