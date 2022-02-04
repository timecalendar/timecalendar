import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:timecalendar/models/calendar_event.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/event_details_screen.dart';
import 'package:timecalendar/utils/color_utils.dart';
import 'package:timecalendar/utils/date_utils.dart';

import 'home_rectangle_event.dart';

class TodayEvents extends StatelessWidget {
  final List<Event?> events;
  final DateTime? eventDay;

  const TodayEvents({
    Key? key,
    required this.eventDay,
    required this.events,
  }) : super(key: key);

  final double hourHeight = 70;
  final double hourColumnWidth = 50;
  final double rightPadding = 10;

  void selectEvent(BuildContext context, Event? event) {
    Navigator.of(context)
        .pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  Widget? getCurrentDayIndicator(int? startHour, int endHour, double dayWidth) {
    if (!AppDateUtils.isToday(eventDay!)) return null;

    DateTime now = DateTime.now();

    if (now.hour < startHour!) {
      return null;
    }
    if (now.hour > startHour + endHour) {
      return null;
    }
    double start = now.hour + (now.minute * 10 / 6) / 100;
    return Positioned(
      left: hourColumnWidth,
      top: (start - startHour) * hourHeight,
      width: dayWidth,
      height: 2,
      child: Container(
        color: ColorUtils.hexToColor('#ff91b1'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dayWidth =
        MediaQuery.of(context).size.width - hourColumnWidth - rightPadding;
    var events = CalendarEvent.listFromEvents(this.events);
    var settingsProvider = Provider.of<SettingsProvider>(context);

    int? startHour;
    int? endHour;

    // Get events hour range
    for (var calendarEvent in events) {
      if (startHour == null || calendarEvent.event!.start.hour < startHour) {
        startHour = calendarEvent.event!.start.hour;
      }
      if (endHour == null || calendarEvent.event!.end.hour + 1 > endHour) {
        endHour = calendarEvent.event!.end.hour;
      }
    }

    if (events.length > 0) {
      if (endHour != null) endHour++;
    } else {
      startHour = 8;
      endHour = 18;
    }
    var nbHours = endHour! - startHour!;

    Widget? dayIndicator = getCurrentDayIndicator(startHour, endHour, dayWidth);

    return Container(
      height: hourHeight * nbHours,
      padding: EdgeInsets.only(right: rightPadding),
      child: Stack(
        children: <Widget>[
          for (var hour = 0; hour < nbHours; hour++)
            Positioned(
              top: hourHeight * hour,
              left: 10,
              child: Text(
                '${hour + startHour}h',
                style: TextStyle(color: Colors.grey),
              ),
            ),
          for (var hour = 0; hour < nbHours; hour++)
            Positioned(
              top: hourHeight * hour + 10,
              left: hourColumnWidth,
              right: 0,
              child: Container(
                color: settingsProvider.currentTheme!.lineColor,
                height: 1,
              ),
            ),
          for (var calendarEvent in events)
            Positioned(
              top: (calendarEvent.event!.startHour - startHour) * hourHeight +
                  10,
              left: calendarEvent.startX * dayWidth + hourColumnWidth,
              width: (calendarEvent.endX - calendarEvent.startX) * dayWidth,
              child: Material(
                color: settingsProvider.getEventColor(calendarEvent.event),
                borderRadius: BorderRadius.circular(15),
                child: InkWell(
                  onTap: () {
                    selectEvent(context, calendarEvent.event);
                  },
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    child: Container(
                      padding: EdgeInsets.all(10),
                      child: Stack(
                        children: <Widget>[
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child:
                                HomeRectangleEvent(event: calendarEvent.event),
                          ),
                        ],
                      ),
                    ),
                    height: (calendarEvent.event!.endHour -
                            calendarEvent.event!.startHour) *
                        hourHeight,
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
              ),
            ),
          if (dayIndicator != null) dayIndicator
        ],
      ),
    );
  }
}
