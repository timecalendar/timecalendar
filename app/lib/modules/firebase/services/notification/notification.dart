import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:timecalendar/modules/shared/utils/app_logger.dart';

/// A handler for an incoming push notification payload.
///
/// Named `NotificationCallback` rather than `NotificationListener` to avoid
/// shadowing Flutter's own `NotificationListener<T>` widget.
typedef NotificationCallback = void Function(Map<String, dynamic> message);

class NotificationAction {
  static const String CALENDAR_CHANGED = 'calendar_changed';
}

class NotificationService {
  static final NotificationService _instance = NotificationService._();
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  final Map<String, List<NotificationCallback>> listeners = {};

  factory NotificationService() {
    return _instance;
  }

  NotificationService._() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      onMessage(message.data);
    });

    getFcmToken();
  }

  Future<String?> getFcmToken() async {
    if (Platform.isIOS || Platform.isMacOS) {
      final apnsToken = await _firebaseMessaging.getAPNSToken();

      if (apnsToken == null) {
        return null;
      }
    }

    return _firebaseMessaging.getToken().catchError((error) {
      AppLogger.error(
        'Error getting FCM token',
        name: 'notification',
        error: error,
      );
      return null;
    });
  }

  Future<dynamic> onMessage(Map<String, dynamic> message) async {
    AppLogger.info('New notification: $message', name: 'notification');
    if (message['action'] != null) {
      handleNotification(message);
    }
  }

  // TODO: Calendar notification
  // Future<void> subscribeToCalendar(DeprecatedCalendar calendar) async {
  //   var token = await _firebaseMessaging.getToken();
  //   var prefs = await SharedPreferences.getInstance();

  //   try {
  //     var body = {
  //       'token': token,
  //       'dayLimit': prefs.getInt('date_limit') ?? 14,
  //       'enabled': prefs.getBool('notification_calendar') ?? true,
  //     };
  //     body.addAll(calendar.getRequestMap());
  //     await http.post(
  //       Uri.parse(Environment.oldApiUrl + "/fcm/subscribe"),
  //       body: jsonEncode(body),
  //     );
  //   } on Exception catch (error) {
  //     throw error;
  //   }
  // }

  void handleNotification(Map<String, dynamic> message) {
    String? action = message['action'];

    if (!this.listeners.containsKey(action)) {
      return;
    }

    this.listeners[action!]!.forEach((listener) {
      listener(message);
    });
  }

  void addEventListener(String action, NotificationCallback listener) {
    if (!this.listeners.containsKey(action)) {
      this.listeners[action] = [];
    }

    this.listeners[action]!.add(listener);
  }

  void removeEventListener(String action, NotificationCallback listener) {
    if (!this.listeners.containsKey(action)) {
      return;
    }

    this.listeners[action]!.remove(listener);
  }

  Future<void> subscribe() async {
    try {
      await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
    } catch (e) {
      AppLogger.error(
        'Failed to request notification permission',
        name: 'notification',
        error: e,
      );
    }
  }

  Future<void> subscribeDelay() async {
    await Future.delayed(Duration(seconds: 1));
    await subscribe();
  }
}
