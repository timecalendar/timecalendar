import CoreFoundation
import Foundation

enum LegacyPreferences {
  static let keys = ["current_version", "theme", "dark_mode", "notification_calendar", "startup_screen", "show_weekends"]

  static func classify(_ object: Any?, key: String) -> [String: Any] {
    guard let object else { return ["state": "absent"] }
    var value: Any?
    switch key {
    case "theme", "startup_screen":
      if let string = object as? String, string.utf8.count <= 256 * 1024 { value = string }
    case "current_version":
      if let number = object as? NSNumber,
         CFGetTypeID(number) != CFBooleanGetTypeID(),
         !["f", "d"].contains(String(cString: number.objCType)),
         number.doubleValue >= -9007199254740991,
         number.doubleValue <= 9007199254740991 {
        value = number.int64Value
      }
    case "dark_mode", "notification_calendar", "show_weekends":
      if let number = object as? NSNumber, CFGetTypeID(number) == CFBooleanGetTypeID() {
        value = number.boolValue
      }
    default:
      break
    }
    guard let value else { return ["state": "invalid_type"] }
    return ["state": "value", "value": value]
  }
}
