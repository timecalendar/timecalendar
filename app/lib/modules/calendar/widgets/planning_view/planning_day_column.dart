import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/ui/events_by_day.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_day_header.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_event_list.dart';

class PlanningDayColumn extends StatelessWidget {
  final EventsByDay eventsByDay;
  final int currentDayIndex;
  final Function onEventTap;
  final Future<String?> Function(DateTime) getNextUid;

  const PlanningDayColumn({
    Key? key,
    required this.eventsByDay,
    required this.currentDayIndex,
    required this.onEventTap,
    required this.getNextUid,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PlanningDayHeader(
          day: eventsByDay.day,
          hasEvents: eventsByDay.events.isNotEmpty,
        ),
        Expanded(
          child: PlanningEventList(
            dayEvents: eventsByDay.events,
            currentDayIndex: currentDayIndex,
            onEventTap: onEventTap,
            getNextUid: getNextUid,
          ),
        ),
      ],
    );
  }
}
