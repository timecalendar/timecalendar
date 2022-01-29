import 'package:firebase_analytics/firebase_analytics.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._();

  static FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  static FirebaseAnalyticsObserver observer =
      FirebaseAnalyticsObserver(analytics: analytics);

  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._();

  static void setAppTheme(bool darkMode) {
    analytics.setUserProperty(
        name: 'app_theme', value: darkMode ? 'dark' : 'light');
  }

  static void setStartupScreen(String startupScreen) {
    analytics.setUserProperty(name: 'startup_screen', value: startupScreen);
  }
}
