import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_tag.dart';

class EventDetailsTags extends StatelessWidget {
  final List<EventTag> tags;

  const EventDetailsTags({Key? key, required this.tags}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, top: 15),
      child: Wrap(
        children: <Widget>[for (var tag in tags) EventDetailsTag(tag: tag)],
      ),
    );
  }
}
