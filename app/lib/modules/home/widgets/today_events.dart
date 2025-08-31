import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/helpers/events_helper.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/ui/event_for_ui.dart';
import 'package:timecalendar/modules/event_details/screens/event_details_screen.dart';
import 'package:timecalendar/modules/home/widgets/home_rectangle_event.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class TodayEvents extends StatelessWidget {
  final List<EventInterface> events;
  final DateTime dayDisplayedOnHomePage;

  const TodayEvents({
    Key? key,
    required this.dayDisplayedOnHomePage,
    required this.events,
  }) : super(key: key);

  final double hourHeight = 70;
  final double hourColumnWidth = 50;
  final double rightPadding = 10;

  void selectEvent(BuildContext context, EventInterface event) {
    Navigator.of(
      context,
    ).pushNamed(EventDetailsScreen.routeName, arguments: event);
  }

  Widget? getCurrentDayIndicator(int? startHour, int endHour, double dayWidth) {
    if (!AppDateUtils.isToday(dayDisplayedOnHomePage)) return null;

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
      child: Container(color: ColorUtils.hexToColor('#ff91b1')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dayWidth =
        MediaQuery.of(context).size.width - hourColumnWidth - rightPadding;
    var events = EventForUI.listFromEvents(this.events);
    var settingsProvider = Provider.of<SettingsProvider>(context);

    int? startHour;
    int? endHour;

    // Get events hour range
    for (var calendarEvent in events) {
      if (startHour == null || calendarEvent.event.startsAt.hour < startHour) {
        startHour = calendarEvent.event.startsAt.hour;
      }
      if (endHour == null || calendarEvent.event.endsAt.hour + 1 > endHour) {
        endHour = calendarEvent.event.endsAt.hour;
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
                color: settingsProvider.currentTheme.lineColor,
                height: 1,
              ),
            ),
          for (var calendarEvent in events)
            Positioned(
              top:
                  (eventStartsAtHour(calendarEvent.event) - startHour) *
                      hourHeight +
                  10,
              left: calendarEvent.startX * dayWidth + hourColumnWidth,
              width: (calendarEvent.endX - calendarEvent.startX) * dayWidth,
              child: Material(
                color: settingsProvider.getEventInterfaceColor(
                  calendarEvent.event,
                ),
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
                            child: HomeRectangleEvent(
                              event: calendarEvent.event,
                            ),
                          ),
                        ],
                      ),
                    ),
                    height:
                        (eventEndsAtHour(calendarEvent.event) -
                            eventStartsAtHour(calendarEvent.event)) *
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
          if (dayIndicator != null) dayIndicator,
        ],
      ),
    );
  }
}
