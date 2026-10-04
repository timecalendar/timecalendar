import Foundation

func expect(_ value: Any?, _ key: String, _ state: String) {
  precondition(LegacyPreferences.classify(value, key: key)["state"] as? String == state, key)
}

expect(nil, "theme", "absent")
expect("dark", "theme", "value")
expect(NSNumber(value: true), "theme", "invalid_type")
expect(NSNumber(value: true), "show_weekends", "value")
expect(NSNumber(value: 1), "show_weekends", "invalid_type")
expect("true", "show_weekends", "invalid_type")
expect(NSNumber(value: 134), "current_version", "value")
expect(NSNumber(value: true), "current_version", "invalid_type")
expect(NSNumber(value: 134.5), "current_version", "invalid_type")
expect(NSNumber(value: 134.0), "current_version", "invalid_type")
expect(NSNumber(value: Double.infinity), "current_version", "invalid_type")
expect(NSNumber(value: Int64.max), "current_version", "invalid_type")
expect(["dark"], "theme", "invalid_type")
expect(String(repeating: "a", count: 256 * 1024), "theme", "value")
expect(String(repeating: "a", count: 256 * 1024 + 1), "theme", "invalid_type")
expect("value", "unknown_key", "invalid_type")
precondition(LegacyPreferences.keys.count == 6)
print("Swift preference classification: 17 assertions passed")

let manager = FileManager.default
let root = manager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
try manager.createDirectory(at: root, withIntermediateDirectories: true)
defer { try? manager.removeItem(at: root) }
let documents = root.appendingPathComponent("Documents")
try manager.createDirectory(at: documents, withIntermediateDirectories: true)
let alias = root.appendingPathComponent("alias")
try manager.createSymbolicLink(at: alias, withDestinationURL: documents)
let absent = try LegacyDatabaseSource.discover(in: alias)
precondition(absent == nil)
let source = documents.appendingPathComponent("simple_database.db")
let contents = Data("{\"version\":3,\"sembast\":1}\n".utf8)
try contents.write(to: source)
let metadata = try LegacyDatabaseSource.discover(in: alias)
precondition(metadata?["sizeBytes"] as? Int64 == Int64(contents.count))
let retained = try Data(contentsOf: source)
precondition(retained == contents)
try manager.removeItem(at: source)
let other = root.appendingPathComponent("other.db")
try contents.write(to: other)
try manager.createSymbolicLink(at: source, withDestinationURL: other)
var rejected = false
do { _ = try LegacyDatabaseSource.discover(in: documents) } catch { rejected = true }
precondition(rejected)
print("Swift source discovery: absent, trusted ancestor alias, source retention, source symlink rejection passed")
