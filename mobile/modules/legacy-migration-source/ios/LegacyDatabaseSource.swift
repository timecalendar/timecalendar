import Foundation

enum LegacyDatabaseSource {
  static func discover(in documents: URL) throws -> [String: Any]? {
    let database = documents.appendingPathComponent("simple_database.db", isDirectory: false)
    do {
      let attributes = try FileManager.default.attributesOfItem(atPath: database.path)
      guard attributes[.type] as? FileAttributeType == .typeRegular,
            database.resolvingSymlinksInPath().path == documents.resolvingSymlinksInPath().appendingPathComponent("simple_database.db").path,
            FileManager.default.isReadableFile(atPath: database.path),
            let size = attributes[.size] as? NSNumber else {
        throw CocoaError(.fileReadUnknown)
      }
      return [
        "uri": database.absoluteString,
        "sizeBytes": size.int64Value,
        "modifiedAtMs": (attributes[.modificationDate] as? Date).map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull()
      ]
    } catch let error as CocoaError where error.code == .fileReadNoSuchFile {
      return nil
    }
  }
}
