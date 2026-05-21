import 'dart:developer' as developer;

/// Lightweight structured logging wrapper around `dart:developer`.
///
/// Replaces ad-hoc `print()` calls in production code. Unlike `print`, these
/// entries carry a level and a source name, are routed to the Dart VM service
/// (so they show up in DevTools), and are stripped from `print`-style stdout
/// noise in release builds.
class AppLogger {
  const AppLogger._();

  /// Informational message — expected, non-error events.
  static void info(String message, {String name = 'timecalendar'}) {
    developer.log(message, name: name, level: 800);
  }

  /// Recoverable problem — something failed but the app keeps working.
  static void error(
    String message, {
    String name = 'timecalendar',
    Object? error,
    StackTrace? stackTrace,
  }) {
    developer.log(
      message,
      name: name,
      level: 1000,
      error: error,
      stackTrace: stackTrace,
    );
  }
}
