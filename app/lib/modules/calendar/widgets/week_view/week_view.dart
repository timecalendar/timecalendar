import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/calendar/widgets/week_view/week_view_layout.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

class WeekView extends HookConsumerWidget {
  const WeekView({
    super.key,
    required this.currentWeek,
    required this.screenHeight,
    required this.calendarWidth,
    required this.leftHoursWidth,
    required this.updateCurrentWeek,
  });

  final int? currentWeek;
  final double screenHeight;
  final double calendarWidth;
  final double leftHoursWidth;
  final ValueChanged<int> updateCurrentWeek;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settingsProvider = oldprovider.Provider.of<SettingsProvider>(
      context,
      listen: true,
    );
    final eventsProvider = ref.watch(eventsForViewProvider);

    print(
      eventsProvider.whenOrNull(
        data: (events) => "data",
        error: (error, stackTrace) => "error",
        loading: () => "loading",
      ),
    );

    final events = eventsProvider.maybeWhen(
      orElse: () => List<EventInterface>.empty(),
      data: (events) => events,
      skipLoadingOnReload: true,
      skipLoadingOnRefresh: true,
    );

    return WeekViewLayout(
      currentWeek: currentWeek,
      screenHeight: screenHeight,
      calendarWidth: calendarWidth,
      nbOfVisibleDays:
          settingsProvider.showWeekends != null &&
                  settingsProvider.showWeekends!
              ? 7
              : 5,
      leftHoursWidth: leftHoursWidth,
      updateCurrentWeek: updateCurrentWeek,
      events: events,
    );
  }
}
