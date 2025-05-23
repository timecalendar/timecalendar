import 'dart:ui';

import 'package:color/color.dart' as PkgColor;
import 'package:flutter/material.dart';

class ColorUtils {
  static Color hexToColor(String code) {
    return new Color(int.parse(code.substring(1, 7), radix: 16) + 0xFF000000);
  }

  static String numberToHex(num value) {
    var color = value.toInt().toRadixString(16);
    if (color.length < 2) {
      color = "0" + color;
    }
    return color;
  }

  static String colorToHex(Color color) {
    var red = numberToHex(color.r);
    var green = numberToHex(color.g);
    var blue = numberToHex(color.b);

    return "#" + red + green + blue;
  }

  static Color darkenColor(Color color, double amount) {
    PkgColor.HslColor hsl =
        new PkgColor.RgbColor(color.r, color.g, color.b).toHslColor();
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
    PkgColor.HslColor hsl =
        new PkgColor.RgbColor(color.r, color.g, color.b).toHslColor();
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
