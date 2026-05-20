import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:hooks_riverpod/misc.dart';
import 'package:timecalendar/modules/shared/services/theme.dart';

/// Shared widget-test harness.
///
/// Wraps [widget] in the same ambient configuration the real app provides
/// (a [MaterialApp] with the app theme, localization delegates and supported
/// locales) plus a Riverpod [ProviderScope]. This keeps widget tests isolated
/// from Firebase and real-network initialization while still rendering widgets
/// the way they appear in production.
///
/// Pass Riverpod [overrides] to swap providers for mocks/fakes. See
/// `test/README.md` for the conventions tests follow.
extension PumpApp on WidgetTester {
  Future<void> pumpApp(
    Widget widget, {
    List<Override> overrides = const [],
  }) {
    return pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: AppTheme.lightTheme.theme,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('fr'), Locale('en')],
          home: Scaffold(body: widget),
        ),
      ),
    );
  }
}
