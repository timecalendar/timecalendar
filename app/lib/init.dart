import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/app.dart';
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/services/theme.dart';

void init({String environment, FirebaseOptions firebaseOptions}) async {
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
  // Init themes
  AppTheme.initDefaultThemes();
  // Load database
  await SimpleDatabase().init();
  runApp(new TimeCalendarApp(prefs));
}
