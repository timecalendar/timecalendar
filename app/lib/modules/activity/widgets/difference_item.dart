import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/activity/models/calendar_log.dart';
import 'package:timecalendar/modules/activity/widgets/calendar_log_event.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class CalendarLogItem extends HookConsumerWidget {
  final CalendarLog calendarLog;

  const CalendarLogItem({Key? key, required this.calendarLog})
    : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final change = calendarLog.calendarChange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.only(
            top: 20,
            bottom: 10,
            left: 25,
            right: 15,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppDateUtils.fullDateTimeText(calendarLog.createdAt),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                calendarLog.calendarName,
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        // New events
        for (var event in change.newItems)
          CalendarLogEventWidget(event: event, type: CalendarLogEventType.New),
        // Changed events
        for (var eventChange in change.changedItems)
          CalendarLogEventWidget(
            event: eventChange.newEvent,
            oldEvent: eventChange.oldEvent,
            type: CalendarLogEventType.Changed,
          ),
        // Deleted events
        for (var event in change.oldItems)
          CalendarLogEventWidget(event: event, type: CalendarLogEventType.Old),
      ],
    );
  }
}
