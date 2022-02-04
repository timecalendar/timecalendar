import 'package:flutter/material.dart';
import 'package:timecalendar/models/event.dart';

import 'package:timecalendar/widgets/home/horizontal_event_item.dart';

class HorizontalEvents extends StatelessWidget {
  final List<Event?> events;

  const HorizontalEvents({
    Key? key,
    required this.events,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: events.length > 0 ? 240 : 0,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemBuilder: (ctx, index) {
          final event = events[index];
          return HorizontalEventItem(event: event);
        },
        itemCount: events.length,
      ),
    );
  }
}
