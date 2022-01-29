import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/models/event.dart';

class HomeRectangleEvent extends StatelessWidget {
  const HomeRectangleEvent({Key key, @required this.event}) : super(key: key);

  final Event event;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          event.title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (event.location.length > 0)
          Container(
            padding: EdgeInsets.only(top: 10),
            child: Wrap(
              children: <Widget>[
                Icon(
                  Icons.location_on,
                  size: 16,
                ),
                SizedBox(width: 5),
                Text(
                  event.location,
                ),
              ],
            ),
          ),
        if (event.totalNotes > 0)
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
                  "${event.completedNotes}/${event.totalNotes}",
                ),
              ],
            ),
          ),
      ],
    );
  }
}
