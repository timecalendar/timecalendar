import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_tag.dart';

class EventDetailsTags extends StatelessWidget {
  final EventInterface event;

  const EventDetailsTags({Key? key, required this.event}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, top: 15),
      child: Wrap(
        children: <Widget>[
          for (var tag in event.tags)
            EventDetailsTag(
              tag: tag,
            ),
        ],
      ),
    );
  }
}
