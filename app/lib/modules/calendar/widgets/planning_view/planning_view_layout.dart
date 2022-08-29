import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/ui/event_for_ui.dart';
import 'package:timecalendar/modules/calendar/models/ui/events_by_day.dart';
import 'package:timecalendar/modules/calendar/providers/calendar_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_for_planning_view_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_rectangle_event.dart';
import 'package:timecalendar/modules/event_details/screens/event_details_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

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

  @override
  void initState() {
    super.initState();

    var eventsByDay = ref.read(eventsForPlanningViewProvider);
    calendarProvider =
        oldprovider.Provider.of<CalendarProvider>(context, listen: false);

    calendarProvider.currentDayNotifier!.addListener(onCurrentDayChange);

    _itemPositionsListener.itemPositions.addListener(() {
      // l'itemPositionsListener se lance dès lors que le widget se met à jour,
      // il faut donc ne pas changer la valeur dès le premier event sinon
      // le widget se recréera infiniement
      var value = _itemPositionsListener.itemPositions.value;
      int index = value.first.index;
      if (index !=
          getCurrentDayIndex(eventsByDay, calendarProvider.currentDay)) {
        widget.updateCurrentDay(eventsByDay[index].day);
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    calendarProvider.currentDayNotifier!.removeListener(onCurrentDayChange);
  }

  void onCurrentDayChange() {
    var eventsByDay = ref.read(eventsForPlanningViewProvider);
    _itemScrollController.jumpTo(
        index: getCurrentDayIndex(
      eventsByDay,
      calendarProvider.currentDay,
    ));
  }

  void selectEvent(BuildContext context, EventInterface event) {
    Navigator.of(context)
        .pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  String? getNextUid(DateTime day) {
    final events = ref.read(eventsForViewProvider);
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

  Widget drawIndicator() {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: ColorUtils.hexToColor('#ff6385'),
            borderRadius: BorderRadius.circular(100),
          ),
        ),
        Expanded(
          child: Container(
              transform: Matrix4.translationValues(-1.0, 0.0, 0.0),
              padding: EdgeInsets.symmetric(horizontal: 0, vertical: 1.5),
              color: ColorUtils.hexToColor('#ff6385')),
        )
      ],
    );
  }

  List<Widget> getEventWidgets(
    List<EventInterface> dayEvents,
    int currentDayIndex,
  ) {
    var events = EventForUI.listFromEvents(dayEvents);
    var settingsProvider = oldprovider.Provider.of<SettingsProvider>(context);
    List<Widget> widgets = [];
    for (var calendarEvent in events) {
      if (getNextUid(calendarEvent.event.startsAt) == calendarEvent.event.uid) {
        widgets.add(drawIndicator());
      }
      widgets.add(Container(
        child: Material(
          color: settingsProvider.getEventInterfaceColor(calendarEvent.event),
          borderRadius: BorderRadius.circular(15),
          child: InkWell(
            onTap: () {
              selectEvent(context, calendarEvent.event);
            },
            borderRadius: BorderRadius.circular(15),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    child: Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        child: PlanningRectangleEvent(
                          event: calendarEvent.event,
                        )),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          offset: Offset(0, 3),
                          color: Color.fromRGBO(0, 0, 0, 0.06),
                          blurRadius: 15,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        margin: EdgeInsets.symmetric(vertical: 4),
      ));
    }
    return widgets;
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider =
        oldprovider.Provider.of<SettingsProvider>(context, listen: true);
    calendarProvider =
        oldprovider.Provider.of<CalendarProvider>(context, listen: true);
    final eventsByDay = ref.watch(eventsForPlanningViewProvider);
    currentDayIndex =
        getCurrentDayIndex(eventsByDay, calendarProvider.currentDay);
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
            padding: EdgeInsets.only(right: 15, left: 8, top: 10, bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: EdgeInsets.only(top: 4, right: 8),
                  child: eventsByDay[index].events.length > 0
                      ? Column(children: [
                          Container(
                            child: Center(
                              child: Text(
                                AppDateUtils.fullDayToShortDay(
                                  eventsByDay[index].day,
                                ).toUpperCase(),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: settingsProvider.darkMode
                                      ? Color(0xffcccccc)
                                      : Colors.black,
                                ),
                              ),
                            ),
                          ),
                          Container(
                            child: Center(
                              child: Text(
                                eventsByDay[index].day.day.toString(),
                                style: TextStyle(fontSize: 18),
                              ),
                            ),
                          ),
                        ])
                      : null,
                ),
                Expanded(
                  // width: widget.calendarWidth,
                  child: Column(
                    children: getEventWidgets(
                        eventsByDay[index].events, currentDayIndex),
                  ),
                ),
              ],
            ),
          );
        },
        itemCount: eventsByDay.length,
      ),
    );
  }
}
