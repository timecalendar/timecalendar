import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class Environment {
  String get mainApiUrl =>
      dotenv.env['MAIN_API_URL'] ?? 'https://api.timecalendar.app';

  String get mainWebUrl =>
      dotenv.env['MAIN_WEB_URL'] ?? 'https://web.timecalendar.host';

  Future<void> load() async {
    await dotenv.load();
  }
}

final environmentProvider = Provider((ref) => Environment());
