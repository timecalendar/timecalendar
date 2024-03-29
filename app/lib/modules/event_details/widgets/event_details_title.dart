import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class EventDetailsTitle extends StatelessWidget {
  const EventDetailsTitle({
    Key? key,
    required this.event,
  }) : super(key: key);

  final EventInterface event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 32),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          // Event color square
          Consumer<SettingsProvider>(
            builder: (context, settingsProvider, child) {
              return Container(
                margin: EdgeInsets.symmetric(vertical: 8),
                height: 20,
                width: 20,
                decoration: BoxDecoration(
                  color: settingsProvider.getEventInterfaceColor(event),
                  borderRadius: BorderRadius.circular(5),
                ),
              );
            },
          ),
          SizedBox(width: 25),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  event.title,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  AppDateUtils.eventDateTimeText(event.startsAt, event.endsAt),
                  style: TextStyle(
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
