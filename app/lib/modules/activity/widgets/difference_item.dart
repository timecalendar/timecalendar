import 'package:flutter/material.dart';
import 'package:timecalendar/modules/activity/models/difference.dart';

class DifferenceItem extends StatelessWidget {
  final Difference? difference;

  const DifferenceItem({Key? key, this.difference}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.only(
            top: 20,
            bottom: 10,
            left: 25,
            right: 15,
          ),
          // child: Text(
          //   AppDateUtils.fullDateTimeText(difference!.dateDiff),
          // ),
        ),
        // TODO: Calendar activity
        // for (var event in difference!.newItems)
        //   new DifferenceEvent(
        //     event: event,
        //     oldEvent: null,
        //     type: DifferenceEventType.New,
        //   ),
        // for (var events in difference!.changedItems)
        //   new DifferenceEvent(
        //     event: events.item2,
        //     oldEvent: events.item1,
        //     type: DifferenceEventType.Changed,
        //   ),
        // for (var event in difference!.oldItems)
        //   new DifferenceEvent(
        //     event: event,
        //     oldEvent: null,
        //     type: DifferenceEventType.Old,
        //   ),
      ],
    );
  }
}
