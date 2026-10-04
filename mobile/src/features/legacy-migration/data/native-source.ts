// The local Expo module is CNG-owned outside src; this is its only application edge.

import { File, FileMode } from "expo-file-system"

// eslint-disable-next-line no-restricted-imports
import { getLegacyMigrationSource } from "../../../../modules/legacy-migration-source"

// eslint-disable-next-line no-restricted-imports
export type {
  LegacyMigrationSource,
  LegacyPreferenceKey,
  LegacyPreferenceRead,
} from "../../../../modules/legacy-migration-source"
export { getLegacyMigrationSource }

export async function* readLegacyBytes(
  uri: string,
): AsyncGenerator<Uint8Array> {
  const file = new File(uri)
  const handle = file.open(FileMode.ReadOnly)
  try {
    while (true) {
      const bytes = handle.readBytes(64 * 1024)
      if (bytes.length === 0) return
      yield bytes
      // Yield between chunks so the bounded parser does not monopolize Hermes.
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  } finally {
    handle.close()
  }
}
