import 'package:flutter/services.dart';

enum StatusBarBackground { Transparent, AccentColor }

class StatusBarService {
  setStatusBarColor({
    required bool darkTextOnLightBackground,
    StatusBarBackground statusBarBackground = StatusBarBackground.AccentColor,
  }) {
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle.dark.copyWith(
        statusBarBrightness: darkTextOnLightBackground
            ? Brightness.light
            : Brightness.dark,
      ),
    );
  }
}
