import 'package:hooks_riverpod/hooks_riverpod.dart';

class Environment {
  String get mainApiUrl => const String.fromEnvironment(
    'MAIN_API_URL',
    defaultValue: 'https://api.timecalendar.app',
  );

  String get mainWebUrl => const String.fromEnvironment(
    'MAIN_WEB_URL',
    defaultValue: 'https://web.timecalendar.host',
  );
}

final environmentProvider = Provider((ref) => Environment());
