import 'package:flutter/material.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/widgets/event_details/event_details_tag.dart';

class EventDetailsTags extends StatelessWidget {
  final Event? event;

  const EventDetailsTags({Key? key, this.event}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, top: 15),
      child: Wrap(
        children: <Widget>[
          for (var tag in event!.tags) EventDetailsTag(
            tag: tag,
          ),
        ],
      ),
    );
  }
}
