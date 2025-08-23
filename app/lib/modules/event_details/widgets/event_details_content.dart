import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_line.dart';
import 'package:collection/collection.dart';

class EventDetailsContent extends HookConsumerWidget {
  final EventInterface event;

  const EventDetailsContent({Key? key, required this.event}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final calendars = ref.watch(userCalendarProvider).value;
    final currentCalendar = calendars?.firstWhereOrNull(
      (calendar) => calendar.id == event.userCalendarId,
    );
    final currentCalendarName = currentCalendar?.name;

    return Column(
      children: [
        if (event.location != null && event.location!.length > 0)
          EventDetailsLine(icon: Icons.location_on, text: event.location),
        if (calendars != null &&
            calendars.length > 1 &&
            currentCalendarName != null)
          EventDetailsLine(
            icon: Icons.calendar_month,
            text: currentCalendarName,
          ),
        if (event.teachers.length > 0)
          EventDetailsLine(
            icon: FontAwesomeIcons.graduationCap,
            text: event.teachers.join("\n"),
          ),
        if (event.description != null && event.description!.length > 0)
          EventDetailsLine(icon: Icons.comment, text: event.description),
        SizedBox(height: 10),
      ],
    );
  }
}
