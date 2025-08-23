import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class EventDetailsFooter extends StatelessWidget {
  final EventInterface event;

  const EventDetailsFooter({Key? key, required this.event}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(
            "Mis à jour ${AppDateUtils.fullDateTimeText(event.exportedAt)}",
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
