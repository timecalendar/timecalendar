import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_image/network.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/app.dart';
import 'package:timecalendar/modules/shared/constants/environment.dart';
import 'package:timecalendar/firebase_options.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

main() async {
  final container = ProviderContainer();

  WidgetsFlutterBinding.ensureInitialized();

  // Environment variables
  await container.read(environmentProvider).load();
  // Orientation
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  // Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  FlutterError.onError = (FlutterErrorDetails details) async {
    if (details.exception is FetchFailure) return;
    FirebaseCrashlytics.instance.recordFlutterFatalError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    if (error is DioException) {
      if (error.error is SocketException || error.error is HttpException)
        return true;
      if (error.response?.statusCode != null &&
          error.response!.statusCode! < 400) return true;
    }

    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  // FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  // Load preferences
  final prefs = await SharedPreferences.getInstance();
  final settings = SettingsProvider();
  await settings.loadSettings(prefs);
  // Load database
  await SimpleDatabase().init();
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: TimeCalendarApp(prefs),
    ),
  );
}
