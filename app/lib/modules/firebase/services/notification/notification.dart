import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/modules/shared/constants/environment.dart';
import 'package:timecalendar/modules/calendar/models/calendar.dart';

typedef NotificationListener = Function(Map<String, dynamic> message);

class NotificationAction {
  static const String CALENDAR_CHANGED = 'calendar_changed';
}

class NotificationService {
  static final NotificationService _instance = NotificationService._();
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  final List<Function> calendarUpdateListeners = [];
  final Map<String, List<Function>> listeners = {};

  factory NotificationService() {
    return _instance;
  }

  NotificationService._() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      onMessage(message.data);
    });

    _firebaseMessaging.getToken().then((value) {
      print(value);
    });
  }

  Future<dynamic> onMessage(Map<String, dynamic> message) async {
    print('New notification: ' + message.toString());
    if (message['action'] != null) {
      handleNotification(message);
    }
  }

  Future<void> subscribeToCalendar(Calendar calendar) async {
    var token = await _firebaseMessaging.getToken();
    var prefs = await SharedPreferences.getInstance();

    try {
      var body = {
        'token': token,
        'dayLimit': prefs.getInt('date_limit') ?? 14,
        'enabled': prefs.getBool('notification_calendar') ?? true,
      };
      body.addAll(calendar.getRequestMap());
      await http.post(
        Uri.parse(Environment.oldApiUrl + "/fcm/subscribe"),
        body: jsonEncode(body),
      );
    } on Exception catch (error) {
      throw error;
    }
  }

  void handleNotification(Map<String, dynamic> message) {
    String? action = message['action'];

    if (!this.listeners.containsKey(action)) {
      return;
    }

    this.listeners[action!]!.forEach((listener) {
      listener(message);
    });
  }

  void addEventListener(String action, NotificationListener listener) {
    if (!this.listeners.containsKey(action)) {
      this.listeners[action] = [];
    }

    this.listeners[action]!.add(listener);
  }

  void removeEventListener(String action, NotificationListener listener) {
    if (!this.listeners.containsKey(action)) {
      return;
    }

    this.listeners[action]!.remove(listener);
  }

  Future<void> subscribe() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
  }

  Future<void> subscribeDelay() async {
    await Future.delayed(Duration(seconds: 1));
    await subscribe();
  }
}
