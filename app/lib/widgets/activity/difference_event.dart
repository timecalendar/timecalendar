import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/utils/color_utils.dart';
import 'package:timecalendar/utils/date_utils.dart';

enum DifferenceEventType { New, Old, Changed }

class DifferenceEvent extends StatelessWidget {
  DifferenceEvent({
    Key key,
    @required this.event,
    @required this.oldEvent,
    @required this.type,
  }) : super(key: key);

  final Event event;
  final Event oldEvent;
  final DifferenceEventType type;

  final types = {
    DifferenceEventType.New: {
      'text': 'Nouveau cours',
      'backgroundColor': '#ccffbd',
      'iconColor': '#5ae630',
      'icon': FontAwesomeIcons.plus,
    },
    DifferenceEventType.Old: {
      'text': 'Cours annulé',
      'backgroundColor': '#ffccd9',
      'iconColor': '#ff385d',
      'icon': FontAwesomeIcons.times,
    },
    DifferenceEventType.Changed: {
      'text': 'Cours modifié',
      'backgroundColor': '#c7e6ff',
      'iconColor': '#43a7f7',
      'icon': FontAwesomeIcons.pencilAlt,
    }
  };

  Widget eventIcon() {
    return Column(
      children: <Widget>[
        SizedBox(height: 4),
        CircleAvatar(
          child: Icon(
            types[type]['icon'],
            size: 18,
            color: ColorUtils.hexToColor(types[type]['iconColor']),
          ),
          backgroundColor:
              ColorUtils.hexToColor(types[type]['backgroundColor']),
        ),
      ],
    );
  }

  Widget infoText() {
    var text = AppDateUtils.eventDateTimeText(event.start, event.end);

    return Text(
      text,
      style: TextStyle(
        fontSize: 14,
      ),
    );
  }

  Widget locationText() {
    return Row(
      children: <Widget>[
        Icon(
          Icons.location_on,
          size: 14,
        ),
        SizedBox(width: 5),
        Expanded(
          child: Text(
            event.location,
            style: TextStyle(
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 15),
      child: Container(
        child: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              eventIcon(),
              SizedBox(
                width: 15,
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      event.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      types[type]['text'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    SizedBox(
                      height: 10,
                    ),
                    infoText(),
                    if (event.location != null && event.location.length > 0)
                      locationText(),
                  ],
                ),
              ),
            ],
          ),
        ),
        decoration: BoxDecoration(
          color: settingsProvider.currentTheme.cardColor,
          borderRadius: BorderRadius.circular(15),
        ),
      ),
    );
  }
}
