import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/utils/date_utils.dart';

class HiddenEventItem extends StatelessWidget {
  final Event? event;
  final String? namedEvent;
  final int index;
  final Function removeItem;
  const HiddenEventItem({
    Key? key,
    this.event,
    this.namedEvent,
    required this.index,
    required this.removeItem,
  }) : super(key: key);

  Widget infoText() {
    var text = AppDateUtils.eventDateTimeText(event!.start, event!.end);
    return Text(
      text,
      style: TextStyle(
        fontSize: 14,
      ),
    );
  }

  Widget getTextCategory(BuildContext context) {
    var eventProvider = Provider.of<EventsProvider>(context, listen: false);

    if (this.index == 0 &&
        eventProvider.hiddenEvent.namedHiddenEvents.length > 0) {
      return Text('Groupe d\'événements masqués');
    } else {
      return Text('Événements masqués');
    }
  }

  Widget infoCategory(BuildContext context) {
    var eventProvider = Provider.of<EventsProvider>(context, listen: false);
    if (this.index == 0 ||
        this.index == eventProvider.hiddenEvent.namedHiddenEvents.length) {
      return Padding(
        padding: const EdgeInsets.only(
          top: 20,
          bottom: 10,
          left: 25,
          right: 15,
        ),
        child: getTextCategory(context),
      );
    } else {
      return SizedBox(
        width: 0.0,
        height: 0.0,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

    return Column(
      children: <Widget>[
        infoCategory(context),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 15),
          child: Container(
            child: Padding(
              padding: const EdgeInsets.all(15.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          (event != null) ? event!.title! : this.namedEvent!,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(
                          height: 10,
                        ),
                        (event != null) ? infoText() : SizedBox(),
                      ],
                    ),
                  ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Container(
                        padding: EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: settingsProvider.currentTheme.primaryColor,
                        ),
                        child: IconButton(
                          tooltip: (event != null)
                              ? "Afficher l'événement"
                              : "Afficher les événements",
                          color: settingsProvider.currentTheme.cardColor,
                          icon: Icon(Icons.event_busy),
                          onPressed: () => this.removeItem(),
                        ),
                      )
                    ],
                  )
                ],
              ),
            ),
            decoration: BoxDecoration(
              color: settingsProvider.currentTheme.cardColor,
              borderRadius: BorderRadius.circular(15),
            ),
          ),
        )
      ],
    );
  }
}
