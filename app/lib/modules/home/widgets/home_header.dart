import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class HomeHeader extends StatelessWidget {
  final List<DeprecatedEvent?> events;
  final DateTime? eventDay;

  const HomeHeader({
    Key? key,
    required this.eventDay,
    required this.events,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'TimeCalendar',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 5),
          Text(
            events.length > 0
                ? events.length.toString() +
                    ' cours ' +
                    AppDateUtils.dayText(eventDay, showOn: true)
                : 'Pas de cours à venir',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
