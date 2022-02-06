import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/app.dart';
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/providers/settings_provider.dart';

Future<void> init(
    {required String environment, FirebaseOptions? firebaseOptions}) async {
  WidgetsFlutterBinding.ensureInitialized();
  // Environment variables
  await Environment.load(environment);
  // Orientation
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  // Firebase
  await Firebase.initializeApp(options: firebaseOptions);
  // FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  // Load preferences
  final prefs = await SharedPreferences.getInstance();
  final settings = SettingsProvider();
  await settings.loadSettings(prefs);
  // Load database
  await SimpleDatabase().init();
  runApp(new TimeCalendarApp(prefs));
}
