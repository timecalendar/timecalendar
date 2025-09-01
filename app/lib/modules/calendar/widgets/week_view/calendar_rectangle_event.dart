import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:timecalendar/modules/event_details/providers/event_nb_checklist_items_provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/calendar/models/ui/event_for_ui.dart';

class CalendarRectangleEvent extends ConsumerWidget {
  const CalendarRectangleEvent({Key? key, required this.calendarEvent})
    : super(key: key);

  final EventForUI calendarEvent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settingsProvider = oldprovider.Provider.of<SettingsProvider>(
      context,
      listen: true,
    );
    final event = calendarEvent.event;
    final eventChecklistItems = ref.watch(getEventNbChecklistItemsProvider)(
      event.uid,
    );

    return Stack(
      children: <Widget>[
        if (eventChecklistItems.totalNotes > 0)
          Align(
            alignment: Alignment.topRight,
            child: Container(
              height: 5,
              width: 5,
              decoration: BoxDecoration(
                color:
                    (eventChecklistItems.completedNotes ==
                        eventChecklistItems.totalNotes)
                    ? Colors.black.withValues(alpha: 0.4)
                    : Theme.of(context).primaryColor,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (eventChecklistItems.totalNotes > 0) SizedBox(height: 2),
            Text(
              event.title,
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
            if (event.location != null && event.location!.length > 0)
              Wrap(
                children: <Widget>[
                  Text(
                    calendarEvent.event.location!,
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
              ),
          ],
        ),
      ],
    );
  }
}
