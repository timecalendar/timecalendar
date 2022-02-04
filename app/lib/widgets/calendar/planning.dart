import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'package:timecalendar/models/calendar_event.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/models/event_by_day.dart';
import 'package:timecalendar/providers/calendar_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/event_details_screen.dart';
import 'package:timecalendar/utils/color_utils.dart';
import 'package:timecalendar/utils/date_utils.dart';
import 'package:timecalendar/widgets/calendar/planning_rectangle_event.dart';

class Planning extends StatefulWidget {
  const Planning({
    Key? key,
    required this.updateCurrentWeek,
    required this.currentWeek,
    required this.updateCurrentDay,
  });

  final int? currentWeek;
  final ValueChanged<int> updateCurrentWeek;

  final Function updateCurrentDay;

  @override
  _PlanningState createState() => _PlanningState();
}

class _PlanningState extends State<Planning> {
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
    var events = Provider.of<EventsProvider>(context, listen: false);
    calendarProvider = Provider.of<CalendarProvider>(context, listen: false);
    events.loadEventByDay();
    calendarProvider.currentDayNotifier!.addListener(onCurrentDayChange);

    // WidgetsBinding.instance.addPostFrameCallback((_) =>
    // _itemScrollController.scrollTo(
    //     index: getCurrentDayIndex(
    //         events.eventsByDay, calendarProvider.currentDay),
    //     duration: Duration(seconds: 1)));
    _itemPositionsListener.itemPositions.addListener(() {
      // l'itemPositionsListener se lance dès lors que le widget se met à jour,
      // il faut donc ne pas changer la valeur dès le premier event sinon
      // le widget se recréera infiniement
      var value = _itemPositionsListener.itemPositions.value;
      int index = value.first.index;
      // print(index);
      if (index !=
          getCurrentDayIndex(events.eventsByDay, calendarProvider.currentDay)) {
        widget.updateCurrentDay(events.eventsByDay[index].day);
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    calendarProvider.currentDayNotifier!.removeListener(onCurrentDayChange);
  }

  void onCurrentDayChange() {
    var events = Provider.of<EventsProvider>(context, listen: false);
    _itemScrollController.jumpTo(
        index: getCurrentDayIndex(
            events.eventsByDay, calendarProvider.currentDay));
  }

  void selectEvent(BuildContext context, Event? event) {
    Navigator.of(context)
        .pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  String? getNextUid(EventsProvider events, DateTime day) {
    var date = DateTime.now();
    for (var event in events.homeEvents) {
      if (date.isBefore(event!.end)) {
        return event.uid;
      }
    }
    return "";
  }

  int getCurrentDayIndex(List<EventByDay> eventsByDay, DateTime? day) {
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

  List<Widget> getEventWidgets(List<Event?> dayEvents, int currentDayIndex) {
    var events = CalendarEvent.listFromEvents(dayEvents);
    var settingsProvider = Provider.of<SettingsProvider>(context);
    var eventsProvider = Provider.of<EventsProvider>(context);
    List<Widget> widgets = [];
    for (var calendarEvent in events) {
      if (getNextUid(eventsProvider, calendarEvent.event!.start) ==
          calendarEvent.event!.uid) {
        widgets.add(drawIndicator());
      }
      widgets.add(Container(
        child: Material(
          color: settingsProvider.getEventColor(calendarEvent.event),
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
                    // height: 100,
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
    var settingsProvider = Provider.of<SettingsProvider>(context, listen: true);
    calendarProvider = Provider.of<CalendarProvider>(context, listen: true);
    return Consumer<EventsProvider>(builder: (context, events, child) {
      final eventsByDay = events.eventsByDay;
      currentDayIndex =
          getCurrentDayIndex(eventsByDay, calendarProvider.currentDay);
      return Container(
          decoration: BoxDecoration(
              color:
                  settingsProvider.darkMode ? Color(0xff222222) : Colors.white),
          child: ScrollablePositionedList.builder(
            // itemExtent: widget.calendarWidth,
            scrollDirection: Axis.vertical,
            itemScrollController: _itemScrollController,
            itemPositionsListener: _itemPositionsListener,
            initialScrollIndex: currentDayIndex,
            // physics: scrollPhysics,

            itemBuilder: (ctx, index) {
              return Container(
                  // decoration: BoxDecoration(
                  //   color: Colors.cyan,
                  //   border: Border.all(color: Colors.amber[300]),
                  // ),
                  padding:
                      EdgeInsets.only(right: 15, left: 8, top: 10, bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: EdgeInsets.only(top: 4, right: 8),
                        child: eventsByDay[index].events.length > 0
                            ? Column(children: [
                                Container(
                                    // decoration: BoxDecoration(
                                    //     borderRadius: BorderRadius.circular(8),
                                    //     color: settingsProvider
                                    //         .currentTheme.accentColor),
                                    child: Center(
                                        child: Text(
                                  AppDateUtils.fullDayToShortDay(
                                          eventsByDay[index].day)
                                      .toUpperCase(),
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: settingsProvider.darkMode
                                          ? Color(0xffcccccc)
                                          : Colors.black),
                                ))),
                                Container(
                                    // decoration: BoxDecoration(
                                    //     borderRadius: BorderRadius.circular(8),
                                    //     color: settingsProvider
                                    //         .currentTheme.accentColor),
                                    child: Center(
                                        child: Text(
                                  eventsByDay[index].day.day.toString(),
                                  style: TextStyle(fontSize: 18),
                                ))),
                              ])
                            : null,
                      ),
                      Expanded(
                          // width: widget.calendarWidth,
                          child: Column(
                        children: getEventWidgets(
                            eventsByDay[index].events, currentDayIndex),
                      )),
                    ],
                  ));
            },
            itemCount: eventsByDay.length,
          ));
    });
  }
}
