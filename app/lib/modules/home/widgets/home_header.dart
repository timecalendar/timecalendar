import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class HomeHeader extends HookConsumerWidget {
  final List<EventInterface> events;
  final DateTime? dayDisplayedOnHomePage;

  const HomeHeader({
    Key? key,
    required this.dayDisplayedOnHomePage,
    required this.events,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'TimeCalendar',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 5),
          Text(
            events.length > 0
                ? "${events.length} cours ${AppDateUtils.dayText(dayDisplayedOnHomePage, showOn: true)}"
                : 'Pas de cours à venir',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
