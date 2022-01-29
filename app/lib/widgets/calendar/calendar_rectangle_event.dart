import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';

import '../../models/calendar_event.dart';

class CalendarRectangleEvent extends StatelessWidget {
  const CalendarRectangleEvent({
    Key key,
    @required this.calendarEvent,
  }) : super(key: key);

  final CalendarEvent calendarEvent;

  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context, listen: true);

    return Stack(
      children: <Widget>[
        if (calendarEvent.event.totalNotes > 0)
          Align(
            alignment: Alignment.topRight,
            child: Container(
              height: 5,
              width: 5,
              decoration: BoxDecoration(
                color: (calendarEvent.event.completedNotes ==
                        calendarEvent.event.totalNotes)
                    ? Colors.black.withOpacity(0.4)
                    : Theme.of(context).primaryColor,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (calendarEvent.event.totalNotes > 0) SizedBox(height: 2),
            Text(
              calendarEvent.event.title,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                shadows: (settingsProvider.darkMode
                    ? <Shadow>[
                        Shadow(
                          offset: Offset(1.0, 1.0),
                          blurRadius: 2.0,
                          color: Color.fromARGB(50, 0, 0, 0),
                        ),
                      ]
                    : null),
              ),
            ),
            if (calendarEvent.event.location.length > 0)
              Wrap(
                children: <Widget>[
                  Text(
                    calendarEvent.event.location,
                    style: TextStyle(
                      fontSize: 9,
                      shadows: (settingsProvider.darkMode
                          ? <Shadow>[
                              Shadow(
                                offset: Offset(1.0, 1.0),
                                blurRadius: 2.0,
                                color: Color.fromARGB(50, 0, 0, 0),
                              ),
                            ]
                          : null),
                    ),
                  ),
                ],
              )
          ],
        ),
      ],
    );
  }
}
