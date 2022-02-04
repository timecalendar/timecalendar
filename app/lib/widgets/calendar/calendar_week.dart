import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/controllers/calendar/sync_scroll_controller.dart';
import 'package:timecalendar/models/calendar_event.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/event_details_screen.dart';
import 'package:timecalendar/utils/color_utils.dart';
import 'package:timecalendar/utils/date_utils.dart';
import 'package:timecalendar/widgets/calendar/calendar_rectangle_event.dart';

class CalendarWeek extends StatefulWidget {
  const CalendarWeek({
    Key? key,
    required this.screenHeight,
    required this.calendarWidth,
    required this.headerHeight,
    required this.nbOfVisibleDays,
    required this.dayWidth,
    required this.calendarHeight,
    required this.hourHeight,
    required this.nbHours,
    required this.startHour,
    required this.columnGap,
    required this.firstDayOfWeek,
    required this.weekEvents,
    required this.columnPaddingTop,
    required SyncScrollController? syncScroll,
  })  : _syncScroll = syncScroll,
        super(key: key);

  final double screenHeight;
  final double calendarWidth;
  final double headerHeight;
  final int nbOfVisibleDays;
  final double dayWidth;
  final double calendarHeight;
  final double hourHeight;
  final int nbHours;
  final int startHour;
  final double columnGap;
  final double columnPaddingTop;
  final DateTime firstDayOfWeek;
  final SyncScrollController? _syncScroll;
  final List<List<Event>> weekEvents;

  @override
  _CalendarWeekState createState() => _CalendarWeekState();
}

class _CalendarWeekState extends State<CalendarWeek> {
  ScrollController? _currentWeekScrollController;

  @override
  void initState() {
    super.initState();
    _currentWeekScrollController =
        ScrollController(initialScrollOffset: widget._syncScroll!.currentOffset);
    widget._syncScroll!.registerScrollController(_currentWeekScrollController);
  }

  @override
  void dispose() {
    super.dispose();
    widget._syncScroll!.unregisterScrollController(_currentWeekScrollController);
  }

  void selectEvent(BuildContext context, Event? event) {
    Navigator.of(context)
        .pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  List<Widget> getCurrentDayIndicator(int day) {
    DateTime startDay = widget.firstDayOfWeek.add(Duration(days: day));
    DateTime endDay = startDay.add(Duration(days: 1));
    DateTime now = DateTime.now();
    if (!startDay.isBefore(now) || !endDay.isAfter(now)) {
      return [];
    }
    if (now.hour < widget.startHour) {
      return [];
    }
    if (now.hour > widget.startHour + widget.nbHours) {
      return [];
    }
    double startHour = now.hour + (now.minute * 10 / 6) / 100;
    return [
      Positioned(
        left: 2,
        top: (startHour - widget.startHour) * widget.hourHeight +
            widget.columnPaddingTop,
        width: widget.dayWidth,
        height: 2,
        child: Container(
          color: ColorUtils.hexToColor('#ff6385'),
        ),
      ),
      Positioned(
        left: 0,
        top: (startHour - widget.startHour) * widget.hourHeight +
            widget.columnPaddingTop -
            2,
        width: 6,
        height: 6,
        child: Container(
          decoration: BoxDecoration(
            color: ColorUtils.hexToColor('#ff6385'),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      )
    ];
  }

  List<Widget> getEventWidgets(int day) {
    var events = CalendarEvent.listFromEvents(widget.weekEvents[day]);
    var settingsProvider = Provider.of<SettingsProvider>(context);

    List<Widget> widgets = [];
    for (var calendarEvent in events) {
      widgets.add(Positioned(
        top: (calendarEvent.event!.startHour - widget.startHour) *
                widget.hourHeight +
            widget.columnPaddingTop,
        left: calendarEvent.startX * widget.dayWidth,
        width: (calendarEvent.endX - calendarEvent.startX) * widget.dayWidth,
        child: Material(
          color: settingsProvider.getEventColor(calendarEvent.event),
          borderRadius: BorderRadius.circular(4),
          child: InkWell(
            onTap: () {
              selectEvent(context, calendarEvent.event);
            },
            borderRadius: BorderRadius.circular(4),
            child: Container(
              child: Container(
                padding: EdgeInsets.all(4),
                child: Stack(
                  children: <Widget>[
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: (calendarEvent.endX - calendarEvent.startX) *
                                  widget.dayWidth >=
                              20
                          ? CalendarRectangleEvent(calendarEvent: calendarEvent)
                          : Container(),
                    ),
                  ],
                ),
              ),
              height: (calendarEvent.event!.endHour -
                      calendarEvent.event!.startHour) *
                  widget.hourHeight,
            ),
          ),
        ),
      ));
    }
    return widgets;
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context);

    return Container(
      height: widget.screenHeight,
      width: widget.calendarWidth,
      child: Stack(
        children: <Widget>[
          Positioned(
            top: 0,
            left: 0,
            height: widget.headerHeight,
            width: widget.calendarWidth,
            child: Container(
              child: Row(
                children: <Widget>[
                  for (var day = 0; day < widget.nbOfVisibleDays; day++)
                    Container(
                      width: widget.dayWidth,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: <Widget>[
                          Text(
                            AppDateUtils.calendarWeekDayText(
                              widget.firstDayOfWeek.add(Duration(days: day)),
                            ),
                            style: TextStyle(
                              color: AppDateUtils.isToday(widget.firstDayOfWeek
                                      .add(Duration(days: day)))
                                  ? Theme.of(context).colorScheme.secondary
                                  : Colors.grey[500],
                            ),
                          ),
                          Container(
                            height: 32,
                            width: 32,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: <Widget>[
                                Container(
                                  height: 20,
                                  child: Text(
                                    AppDateUtils.calendarDayNumberText(
                                      widget.firstDayOfWeek
                                          .add(Duration(days: day)),
                                    ),
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 17,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            decoration: (AppDateUtils.isToday(widget
                                    .firstDayOfWeek
                                    .add(Duration(days: day))))
                                ? BoxDecoration(
                                    borderRadius: BorderRadius.circular(15),
                                    boxShadow: [
                                      BoxShadow(
                                        offset: Offset(0, 3),
                                        color: Theme.of(context)
                                            .colorScheme
                                            .secondary
                                            .withOpacity(0.4),
                                      ),
                                    ],
                                  )
                                : null,
                          ),
                        ],
                      ),
                    )
                ],
              ),
            ),
          ),
          Positioned(
            top: widget.headerHeight,
            left: 0,
            height: widget.calendarHeight,
            width: widget.calendarWidth,
            child: NotificationListener<ScrollNotification>(
                child: SingleChildScrollView(
                  controller: _currentWeekScrollController,
                  child: Container(
                    height: widget.hourHeight * widget.nbHours,
                    width: widget.calendarWidth,
                    child: Stack(
                      children: <Widget>[
                        // For each column (each day)
                        for (var day = 0; day < widget.nbOfVisibleDays; day++)
                          Positioned(
                            height: widget.hourHeight * widget.nbHours,
                            top: 0,
                            left: day * widget.dayWidth,
                            width: widget.dayWidth,
                            child: Stack(
                              children: <Widget>[
                                for (var hour = 0;
                                    hour < widget.nbHours;
                                    hour++)
                                  Positioned(
                                    top: widget.hourHeight * hour +
                                        widget.columnPaddingTop,
                                    left: widget.columnGap,
                                    width:
                                        widget.dayWidth - 2 * widget.columnGap,
                                    child: Container(
                                      color: settingsProvider
                                          .currentTheme!.lineColor,
                                      height: 1,
                                    ),
                                  ),
                                ...getEventWidgets(day),
                                ...getCurrentDayIndicator(day)
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                onNotification: (ScrollNotification scrollInfo) {
                  widget._syncScroll!.processNotification(
                      scrollInfo, _currentWeekScrollController);
                  return;
                } as bool Function(ScrollNotification)?),
          ),
        ],
      ),
    );
  }
}
