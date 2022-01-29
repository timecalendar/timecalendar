import 'package:flutter_dotenv/flutter_dotenv.dart';

class Environment {
  static String get mainApiUrl =>
      dotenv.env['MAIN_API_URL'] ?? 'https://api.timecalendar.app/';

  static void load(String environment) async {
    await dotenv.load(fileName: _getEnvFile(environment));

    print("environment");
    print(Environment.mainApiUrl);
  }

  static _getEnvFile(String environment) {
    if (environment == "preprod") return ".env.preprod";
    if (environment == "production") return ".env.production";
    return ".env";
  }
}
