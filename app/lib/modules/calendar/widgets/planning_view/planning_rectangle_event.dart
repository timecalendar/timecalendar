import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/providers/event_nb_checklist_items_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class PlanningRectangleEvent extends ConsumerWidget {
  const PlanningRectangleEvent({Key? key, required this.event})
      : super(key: key);

  final EventInterface event;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventChecklistItems =
        ref.watch(getEventNbChecklistItemsProvider)(event.uid);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          event.title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (event.location != null && event.location!.length > 0)
          Container(
            child: Wrap(
              children: <Widget>[
                Text(
                  "${AppDateUtils.eventPlanningDateTimeText(
                    event.startsAt,
                    event.endsAt,
                  )} (${event.location})",
                ),
              ],
            ),
          ),
        if (eventChecklistItems.totalNotes > 0)
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
                  "${eventChecklistItems.completedNotes}/${eventChecklistItems.totalNotes}",
                ),
              ],
            ),
          ),
      ],
    );
  }
}
