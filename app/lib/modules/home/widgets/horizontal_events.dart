import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/home/widgets/horizontal_event_item.dart';

class HorizontalEvents extends StatelessWidget {
  final List<EventInterface> events;

  const HorizontalEvents({Key? key, required this.events}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: events.length > 0 ? 240 : 0,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemBuilder: (ctx, index) => HorizontalEventItem(event: events[index]),
        itemCount: events.length,
      ),
    );
  }
}
