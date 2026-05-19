import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/calendar/models/ui/calendar_view_type.dart';

import '../../../support/fixtures.dart';
import '../../../support/settings_provider.dart';

void main() {
  group('SettingsProvider.loadSettings', () {
    test('populates the documented defaults when prefs are empty', () async {
      final provider = await loadSettingsProvider();

      expect(provider.dateLimit, 14);
      expect(provider.calendarHourHeight, 60);
      expect(provider.calendarViewType, CalendarViewType.Week);
    });
  });

  group('SettingsProvider event color helpers', () {
    test('getEventColorToSave / getEventColorToDisplay return null for null',
        () async {
      final provider = await loadSettingsProvider();

      expect(provider.getEventColorToSave(null), isNull);
      expect(provider.getEventColorToDisplay(null), isNull);
    });

    test('getEventInterfaceColor uses event.color when colorsByGroup is false',
        () async {
      final provider = await loadSettingsProvider({'theme': 'light'});
      final event = buildCalendarEvent();

      expect(provider.colorsByGroup, isFalse);
      expect(provider.getEventInterfaceColor(event), event.color);
    });

    test('getEventInterfaceColor uses event.groupColor when colorsByGroup is true',
        () async {
      final provider = await loadSettingsProvider({
        'theme': 'light',
        'colors_by_group': true,
      });
      final event = buildCalendarEvent();

      expect(provider.colorsByGroup, isTrue);
      expect(provider.getEventInterfaceColor(event), event.groupColor);
    });
  });
}
