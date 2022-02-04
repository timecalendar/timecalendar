import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/utils/date_utils.dart';

class PlanningRectangleEvent extends StatelessWidget {
  const PlanningRectangleEvent({Key? key, required this.event})
      : super(key: key);

  final Event? event;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          event!.title!,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (event!.location!.length > 0)
          Container(
            child: Wrap(
              children: <Widget>[
                Text(
                  AppDateUtils.eventPlanningDateTimeText(
                          event!.start, event!.end) +
                      " (${event!.location})",
                ),
              ],
            ),
          ),
        if (event!.totalNotes > 0)
          Container(
            padding: EdgeInsets.only(top: 10),
            child: Wrap(
              children: <Widget>[
                Icon(
                  FontAwesomeIcons.checkSquare,
                  size: 16,
                ),
                SizedBox(width: 5),
                Text(
                  "${event!.completedNotes}/${event!.totalNotes}",
                ),
              ],
            ),
          ),
      ],
    );
  }
}
