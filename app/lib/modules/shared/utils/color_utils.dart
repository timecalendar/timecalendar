import 'dart:ui';

import 'package:color/color.dart' as PkgColor;
import 'package:flutter/material.dart';

class ColorUtils {
  static Color hexToColor(String code) {
    return new Color(int.parse(code.substring(1, 7), radix: 16) + 0xFF000000);
  }

  static String colorToHex(Color color) {
    return "#" + color.toARGB32().toRadixString(16).substring(2);
  }

  static PkgColor.RgbColor colorToRgbColor(Color color) {
    var hexColor = color.toARGB32().toRadixString(16).substring(2);
    var red = int.parse(hexColor.substring(0, 2), radix: 16);
    var green = int.parse(hexColor.substring(2, 4), radix: 16);
    var blue = int.parse(hexColor.substring(4, 6), radix: 16);

    return PkgColor.RgbColor(red, green, blue);
  }

  static Color darkenColor(Color color, double amount) {
    PkgColor.HslColor hsl = colorToRgbColor(color).toHslColor();
    PkgColor.HslColor darkenHsl = new PkgColor.HslColor(
      hsl.h,
      hsl.s,
      hsl.l * (1 - amount),
    );
    PkgColor.RgbColor darkenRgb = darkenHsl.toRgbColor();
    return Color.fromARGB(
      255,
      darkenRgb.r as int,
      darkenRgb.g as int,
      darkenRgb.b as int,
    );
  }

  static Color lightenColor(Color color, double amount) {
    PkgColor.HslColor hsl = colorToRgbColor(color).toHslColor();
    PkgColor.HslColor lightenHsl = new PkgColor.HslColor(
      hsl.h,
      hsl.s,
      hsl.l / (1 - amount),
    );
    PkgColor.RgbColor lightenRgb = lightenHsl.toRgbColor();
    return Color.fromARGB(
      255,
      lightenRgb.r as int,
      lightenRgb.g as int,
      lightenRgb.b as int,
    );
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
