import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_event_tile.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_indicator.dart';

class PlanningEventList extends StatelessWidget {
  final List<EventInterface> dayEvents;
  final int currentDayIndex;
  final Function onEventTap;
  final Future<String?> Function(DateTime) getNextUid;

  const PlanningEventList({
    Key? key,
    required this.dayEvents,
    required this.currentDayIndex,
    required this.onEventTap,
    required this.getNextUid,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    List<Widget> widgets = [];
    for (var event in dayEvents) {
      widgets.add(
        FutureBuilder<String?>(
          future: getNextUid(event.startsAt),
          builder: (context, snapshot) {
            List<Widget> rowWidgets = [];
            if (snapshot.hasData && snapshot.data == event.uid) {
              rowWidgets.add(const PlanningIndicator());
            }
            rowWidgets.add(
              PlanningEventTile(
                event: event,
                onTap: () => onEventTap(context, event),
              ),
            );
            return Column(children: rowWidgets);
          },
        ),
      );
    }
    return Column(children: widgets);
  }
}
