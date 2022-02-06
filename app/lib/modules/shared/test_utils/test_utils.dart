import 'package:timecalendar/main.dart' as app;
import 'package:flutter_test/flutter_test.dart';

Future<void> waitAppInitialized(WidgetTester tester) async {
  await app.main();
  await tester.pumpAndSettle(Duration(seconds: 2)); // splash screen
}
