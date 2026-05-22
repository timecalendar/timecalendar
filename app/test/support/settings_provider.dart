import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

/// Builds a [SettingsProvider] that has already run `loadSettings`.
///
/// `SettingsProvider.loadSettings` reads `SharedPreferences` and `PackageInfo`,
/// so this mocks both plugin channels first. `setMockInitialValues` also clears
/// any cached `SharedPreferences` instance, giving each test a known starting
/// state from [prefs].
///
/// Pass the result to `settingsProvider.overrideWith` to inject it into a
/// Riverpod scope.
Future<SettingsProvider> loadSettingsProvider([
  Map<String, Object> prefs = const {},
]) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues(prefs);
  PackageInfo.setMockInitialValues(
    appName: 'TimeCalendar',
    packageName: 'com.timecalendar',
    version: '1.0.0',
    buildNumber: '1',
    buildSignature: '',
  );
  final provider = SettingsProvider();
  await provider.loadSettings(await SharedPreferences.getInstance());
  return provider;
}
