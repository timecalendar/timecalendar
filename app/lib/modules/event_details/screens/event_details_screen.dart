import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist_section.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_content.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_footer.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_header.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_tags.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_title.dart';

class EventDetailsScreen extends HookConsumerWidget {
  static const routeName = '/event-details';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventState = useState(
      ModalRoute.of(context)!.settings.arguments as EventInterface,
    );
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
                if (event.tags.length > 0) EventDetailsTags(tags: event.tags),
                SizedBox(height: 16),
                EventDetailsContent(event: event),
                EventDetailsChecklistTitle(),
              ]),
            ),
            EventDetailsChecklist(event: event),
            SliverList(
              delegate: SliverChildListDelegate([
                EventDetailsChecklistAddButton(event: event),
                EventDetailsFooter(event: event),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}
