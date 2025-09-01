import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/providers/checklist_item_provider.dart';

class EventDetailsChecklistTitle extends StatelessWidget {
  const EventDetailsChecklistTitle({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              'Checklist',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class EventDetailsChecklistAddButton extends StatelessWidget {
  final EventInterface event;

  const EventDetailsChecklistAddButton({Key? key, required this.event})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        return InkWell(
          onTap: () {
            ref.read(checklistItemProvider(event.uid).notifier).addItem();
          },
          child: Container(
            padding: EdgeInsets.all(20),
            child: Row(
              children: <Widget>[
                Icon(FontAwesomeIcons.plus, size: 12),
                SizedBox(width: 10),
                Text('Ajouter une note'),
              ],
            ),
          ),
        );
      },
    );
  }
}
