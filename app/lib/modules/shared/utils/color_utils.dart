import 'package:flutter/material.dart';

class ColorUtils {
  static Color hexToColor(String code) {
    return new Color(int.parse(code.substring(1, 7), radix: 16) + 0xFF000000);
  }

  static String colorToHex(Color color) {
    return "#" + color.toARGB32().toRadixString(16).substring(2);
  }

  static Color darkenColor(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness * (1 - amount)).clamp(0.0, 1.0))
        .toColor();
  }

  static Color lightenColor(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness / (1 - amount)).clamp(0.0, 1.0))
        .toColor();
  }

  static Color darkenEvent(Color color) {
    color = ColorUtils.darkenColor(color, 0.28);

    return color;
  }

  static Color lightenEvent(Color color) {
    color = ColorUtils.lightenColor(color, 0.28);

    return color;
  }
}
