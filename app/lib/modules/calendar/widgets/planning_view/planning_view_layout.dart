import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/ui/events_by_day.dart';
import 'package:timecalendar/modules/calendar/providers/calendar_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_for_planning_view_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/event_details/screens/event_details_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_day_column.dart';

class PlanningViewLayout extends ConsumerStatefulWidget {
  const PlanningViewLayout({
    Key? key,
    required this.updateCurrentWeek,
    required this.currentWeek,
    required this.updateCurrentDay,
  });

  final int? currentWeek;
  final ValueChanged<int> updateCurrentWeek;

  final Function updateCurrentDay;

  @override
  _PlanningViewLayoutState createState() => _PlanningViewLayoutState();
}

class _PlanningViewLayoutState extends ConsumerState<PlanningViewLayout> {
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();
  final ItemScrollController _itemScrollController = ItemScrollController();
  final headerHeight = 60.0;
  final columnGap = 2.0;
  final columnPaddingTop = 8.0;
  var hourHeight = 60.0;
  var currentIndex = -1;
  var lastEnd;
  var currentDayIndex = 0;
  late CalendarProvider calendarProvider;
  List<EventsByDay> _eventsByDay = [];

  @override
  void initState() {
    super.initState();
    calendarProvider = oldprovider.Provider.of<CalendarProvider>(
      context,
      listen: false,
    );
    calendarProvider.currentDayNotifier!.addListener(onCurrentDayChange);
    _itemPositionsListener.itemPositions.addListener(() {
      if (_eventsByDay.isEmpty) return;
      var value = _itemPositionsListener.itemPositions.value;
      int index = value.first.index;
      if (index !=
          getCurrentDayIndex(_eventsByDay, calendarProvider.currentDay)) {
        widget.updateCurrentDay(_eventsByDay[index].day);
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    calendarProvider.currentDayNotifier!.removeListener(onCurrentDayChange);
  }

  void onCurrentDayChange() {
    if (_eventsByDay.isEmpty) return;
    _itemScrollController.jumpTo(
      index: getCurrentDayIndex(_eventsByDay, calendarProvider.currentDay),
    );
  }

  void selectEvent(BuildContext context, EventInterface event) {
    Navigator.of(
      context,
    ).pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  Future<String?> getNextUid(DateTime day) async {
    final events = await ref.read(eventsForViewProvider.future);
    var date = DateTime.now();
    for (var event in events) {
      if (date.isBefore(event.endsAt)) {
        return event.uid;
      }
    }
    return "";
  }

  int getCurrentDayIndex(List<EventsByDay> eventsByDay, DateTime? day) {
    var currentDay = 0;
    DateTime currentDateTime;
    do {
      if (currentDay < eventsByDay.length) {
        currentDateTime = eventsByDay[currentDay].day;
      } else {
        return currentDay - 1;
      }
      currentDay++;
    } while (currentDateTime.isBefore(day!));
    return currentDay - 1;
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider = oldprovider.Provider.of<SettingsProvider>(
      context,
      listen: true,
    );
    calendarProvider = oldprovider.Provider.of<CalendarProvider>(
      context,
      listen: true,
    );
    final eventsByDayAsync = ref.watch(eventsForPlanningViewProvider);
    return eventsByDayAsync.when(
      data: (eventsByDay) {
        _eventsByDay = eventsByDay;
        currentDayIndex = getCurrentDayIndex(
          eventsByDay,
          calendarProvider.currentDay,
        );
        return Container(
          decoration: BoxDecoration(
            color: settingsProvider.darkMode ? Color(0xff222222) : Colors.white,
          ),
          child: ScrollablePositionedList.builder(
            scrollDirection: Axis.vertical,
            itemScrollController: _itemScrollController,
            itemPositionsListener: _itemPositionsListener,
            initialScrollIndex: currentDayIndex,
            itemBuilder: (ctx, index) {
              return Container(
                padding: EdgeInsets.only(
                  right: 15,
                  left: 8,
                  top: 10,
                  bottom: 10,
                ),
                child: PlanningDayColumn(
                  eventsByDay: eventsByDay[index],
                  currentDayIndex: currentDayIndex,
                  onEventTap: selectEvent,
                  getNextUid: (date) => getNextUid(date),
                ),
              );
            },
            itemCount: eventsByDay.length,
          ),
        );
      },
      loading: () => Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error loading events')),
    );
  }
}
