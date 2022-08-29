import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/providers/checklist_item_provider.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_header.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_line.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_tags.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_title.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class EventDetailsScreen extends HookConsumerWidget {
  static const routeName = '/event-details';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventState =
        useState(ModalRoute.of(context)!.settings.arguments as EventInterface);
    final event = eventState.value;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: <Widget>[
            SliverList(
              delegate: SliverChildListDelegate([
                EventDetailsHeader(
                  event: event,
                  onEventChange: (changedEvent) {
                    eventState.value = changedEvent;
                  },
                ),
                EventDetailsTitle(event: event),
                if (event.tags.length > 0) EventDetailsTags(event: event),
                if (event.location != null && event.location!.length > 0)
                  EventDetailsLine(
                      icon: Icons.location_on, text: event.location),
                if (event.teachers.length > 0)
                  EventDetailsLine(
                      icon: FontAwesomeIcons.graduationCap,
                      text: event.teachers.join("\n")),
                if (event.description != null && event.description!.length > 0)
                  EventDetailsLine(
                    icon: Icons.comment,
                    text: event.description,
                  ),
                SizedBox(
                  height: 10,
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          'Checklist',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ]),
            ),
            EventDetailsChecklist(event: event),
            SliverList(
              delegate: SliverChildListDelegate([
                InkWell(
                  onTap: () {
                    ref
                        .read(checklistItemProvider(event.uid).notifier)
                        .addItem();
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
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Text(
                        "Mis à jour ${AppDateUtils.fullDateTimeText(event.exportedAt)}",
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ]),
            )
          ],
        ),
      ),
    );
  }
}
