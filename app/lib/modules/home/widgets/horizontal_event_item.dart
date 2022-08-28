import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/event_details/screens/event_details_screen.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

class HorizontalEventItem extends StatelessWidget {
  final DeprecatedEvent? event;

  const HorizontalEventItem({this.event});

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

    return Container(
      width: 220,
      padding: EdgeInsets.only(left: 15, right: 15, top: 20, bottom: 20),
      child: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              offset: Offset(0, 3),
              color: Color.fromRGBO(0, 0, 0, 0.06),
              blurRadius: 15,
            ),
          ],
        ),
        child: Material(
          color: settingsProvider.currentTheme.cardColor,
          borderRadius: BorderRadius.circular(15),
          child: InkWell(
            onTap: () {
              Navigator.of(context)
                  .pushNamed(EventDetailsScreen.routeName, arguments: event);
            },
            borderRadius: BorderRadius.circular(15),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Container(
                        height: 6,
                        width: 6,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          color: settingsProvider.getEventColor(event),
                        ),
                      ),
                      SizedBox(
                        width: 6,
                      ),
                      Expanded(
                        child: Text(
                          DateFormat.jm('fr').format(event!.start) +
                              ' - ' +
                              DateFormat.jm('fr').format(event!.end),
                        ),
                      ),
                      if (event!.totalNotes > 0)
                        Container(
                          height: 12,
                          width: 12,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: (event!.completedNotes == event!.totalNotes)
                                ? Colors.black.withOpacity(0.2)
                                : Theme.of(context).primaryColor,
                          ),
                        )
                    ],
                  ),
                  Expanded(
                    child: Text(
                      event!.title!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      softWrap: false,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 10,
                  ),
                  if (event!.location!.length > 0)
                    Row(
                      children: <Widget>[
                        Icon(Icons.location_on),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            event!.location!,
                            overflow: TextOverflow.fade,
                            softWrap: false,
                          ),
                        ),
                      ],
                    )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
