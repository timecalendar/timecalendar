import ExpoModulesCore
import Foundation

public class LegacyMigrationSourceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LegacyMigrationSource")
    AsyncFunction("getLegacyMigrationSource") { () throws -> [String: Any] in
      guard Bundle.main.bundleIdentifier == "fr.samuelprak.timecalendar" else {
        throw Exception(name: "INELIGIBLE_APPLICATION_ID", description: "INELIGIBLE_APPLICATION_ID", code: "INELIGIBLE_APPLICATION_ID")
      }
      let metadata: [String: Any]?
      do {
        let documents = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
        metadata = try LegacyDatabaseSource.discover(in: documents)
      } catch {
        throw Exception(name: "SOURCE_OPEN_FAILED", description: "SOURCE_OPEN_FAILED", code: "SOURCE_OPEN_FAILED")
      }
      let preferences = Dictionary(uniqueKeysWithValues: LegacyPreferences.keys.map { key in
        let read = LegacyPreferenceReader.read(key: "flutter." + key)
        let result = read["state"] as? String == "read_failed"
          ? ["state": "read_failed"]
          : LegacyPreferences.classify(read["object"], key: key)
        return (key, result)
      })
      return [
        "database": metadata as Any? ?? NSNull(),
        "preferences": preferences,
        "platformEvidence": ["preferenceBackend": "ios-user-defaults"]
      ]
    }
  }
}
