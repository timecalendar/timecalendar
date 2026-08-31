export type LegacyImportPrerequisite = () => Promise<void>

// Phase 09 replaces this typed no-op with the Flutter-to-RN importer. Keeping
// the slot named and awaited now makes its ordering part of startup without
// reading Flutter storage in this change.
export const runLegacyImport: LegacyImportPrerequisite = async () => {}
