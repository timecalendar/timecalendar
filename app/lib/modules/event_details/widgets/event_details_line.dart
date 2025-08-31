import 'package:flutter/material.dart';

class EventDetailsLine extends StatelessWidget {
  const EventDetailsLine({Key? key, required this.text, required this.icon})
    : super(key: key);

  final IconData icon;
  final String? text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          Container(
            width: 30,
            margin: EdgeInsets.symmetric(vertical: 10),
            child: Icon(icon, size: 25),
          ),
          SizedBox(width: 15),
          Expanded(child: Text(text!, style: TextStyle(fontSize: 16))),
        ],
      ),
    );
  }
}
