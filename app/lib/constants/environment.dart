import 'package:flutter_dotenv/flutter_dotenv.dart';

class Environment {
  /// This is the old API, to goal is to migrate to the new API in the next version.
  @deprecated
  static String get oldApiUrl =>
      dotenv.env['OLD_API_URL'] ?? 'https://api.timecalendar.app';

  static String get mainApiUrl =>
      dotenv.env['MAIN_API_URL'] ?? 'https://api.timecalendar.app';

  static Future<void> load() async {
    await dotenv.load();
  }
}
