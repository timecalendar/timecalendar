import 'package:hooks_riverpod/hooks_riverpod.dart';

class Environment {
  String get mainApiUrl => const String.fromEnvironment(
    'MAIN_API_URL',
    defaultValue: 'https://api.timecalendar.host:1443',
  );

  String get mainWebUrl => const String.fromEnvironment(
    'MAIN_WEB_URL',
    defaultValue: 'https://web.timecalendar.host:1443',
  );
}

final environmentProvider = Provider((ref) => Environment());
