import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';

/// Exemplar **pure unit test**.
///
/// `ColorUtils` has no Flutter binding, async, or plugin dependency, so it is
/// tested with plain `group`/`test`. Follow this shape for any pure
/// function/class: arrange inputs, call, assert — no `pumpWidget`.
void main() {
  group('ColorUtils.hexToColor', () {
    test('parses a "#rrggbb" string into an opaque color', () {
      expect(ColorUtils.hexToColor('#ff0000'), const Color(0xFFFF0000));
      expect(ColorUtils.hexToColor('#00ff00'), const Color(0xFF00FF00));
      expect(ColorUtils.hexToColor('#000000'), const Color(0xFF000000));
      expect(ColorUtils.hexToColor('#ffffff'), const Color(0xFFFFFFFF));
    });

    test('is case-insensitive', () {
      expect(
        ColorUtils.hexToColor('#ABCDEF'),
        ColorUtils.hexToColor('#abcdef'),
      );
    });
  });

  group('ColorUtils.colorToHex', () {
    test('formats an opaque color as a lowercase "#rrggbb" string', () {
      expect(ColorUtils.colorToHex(const Color(0xFFFF0000)), '#ff0000');
      expect(ColorUtils.colorToHex(const Color(0xFFFFFFFF)), '#ffffff');
      expect(ColorUtils.colorToHex(const Color(0xFF000000)), '#000000');
    });

    test('round-trips with hexToColor', () {
      const hex = '#3a7bd5';
      expect(ColorUtils.colorToHex(ColorUtils.hexToColor(hex)), hex);
    });
  });

  group('ColorUtils.darkenColor / lightenColor', () {
    const midGrey = Color(0xFF808080);

    test('darkenColor lowers the luminance', () {
      final darker = ColorUtils.darkenColor(midGrey, 0.3);
      expect(darker.computeLuminance(), lessThan(midGrey.computeLuminance()));
    });

    test('lightenColor raises the luminance', () {
      final lighter = ColorUtils.lightenColor(midGrey, 0.3);
      expect(
        lighter.computeLuminance(),
        greaterThan(midGrey.computeLuminance()),
      );
    });

    test('darkenEvent / lightenEvent wrap darken / lighten', () {
      expect(
        ColorUtils.darkenEvent(midGrey).computeLuminance(),
        lessThan(midGrey.computeLuminance()),
      );
      expect(
        ColorUtils.lightenEvent(midGrey).computeLuminance(),
        greaterThan(midGrey.computeLuminance()),
      );
    });
  });
}
