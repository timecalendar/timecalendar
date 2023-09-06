import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

formatDeviceInfo(BaseDeviceInfo deviceInfo) {
  final data = deviceInfo.data;

  switch (defaultTargetPlatform) {
    case TargetPlatform.iOS:
      return "${data['name']} (${data['systemName']} ${data['systemVersion']})";
    case TargetPlatform.android:
      return "${data['model']} (Android ${data['version']?['release']})";
    default:
      return defaultTargetPlatform.toString();
  }
}
