import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';
import 'package:timecalendar/modules/event_details/providers/checklist_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_header.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_line.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_tags.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_title.dart';

class EventDetailsScreen extends StatelessWidget {
  static const routeName = '/event-details';

  @override
  Widget build(BuildContext context) {
    DeprecatedEvent event =
        ModalRoute.of(context)!.settings.arguments as DeprecatedEvent;
    final checklistProvider =
        Provider.of<ChecklistProvider>(context, listen: false);
    final eventsProvider = Provider.of<EventsProvider>(context, listen: false);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: <Widget>[
            SliverList(
              delegate: SliverChildListDelegate([
                EventDetailsHeader(event: event),
                EventDetailsTitle(event: event),
                if (event.tags.length > 0) EventDetailsTags(event: event),
                if (event.location!.length > 0)
                  EventDetailsLine(
                      icon: Icons.location_on, text: event.location),
                if (event.teachers.length > 0)
                  EventDetailsLine(
                      icon: FontAwesomeIcons.graduationCap,
                      text: event.teachers.join("\n")),
                if (event.description!.length > 0)
                  EventDetailsLine(
                      icon: Icons.comment, text: event.description),
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
                  onTap: () async {
                    // Add a new item
                    await checklistProvider.addItem(event.uid);
                    // Reload events
                    await eventsProvider.updateEventNotes();
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
                if (event.exportedAt != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Text(
                          'Mis à jour ' +
                              AppDateUtils.fullDateTimeText(event.exportedAt!),
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
