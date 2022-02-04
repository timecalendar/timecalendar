import 'package:flutter/material.dart';
import 'package:timecalendar/models/event_tag.dart';

class EventDetailsTag extends StatelessWidget {
  final EventTag? tag;

  const EventDetailsTag({Key? key, this.tag}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(right: 8, bottom: 8),
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            tag!.iconData,
            size: 14,
            color: Colors.black,
          ),
          SizedBox(
            width: 10,
          ),
          Text(
            tag!.name!,
            style: TextStyle(color: Colors.black),
          ),
        ],
      ),
      decoration: BoxDecoration(
        color: tag!.color,
        borderRadius: BorderRadius.circular(15),
      ),
    );
  }
}
