import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/activity/models/calendar_log_event.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

enum CalendarLogEventType { New, Old, Changed }

class CalendarLogEventWidget extends HookConsumerWidget {
  final CalendarLogEvent event;
  final CalendarLogEvent? oldEvent;
  final CalendarLogEventType type;

  const CalendarLogEventWidget({
    Key? key,
    required this.event,
    this.oldEvent,
    required this.type,
  }) : super(key: key);

  static const types = {
    CalendarLogEventType.New: {
      'text': 'Nouveau cours',
      'backgroundColor': '#ccffbd',
      'iconColor': '#5ae630',
      'icon': FontAwesomeIcons.plus,
    },
    CalendarLogEventType.Old: {
      'text': 'Cours annulé',
      'backgroundColor': '#ffccd9',
      'iconColor': '#ff385d',
      'icon': FontAwesomeIcons.xmark,
    },
    CalendarLogEventType.Changed: {
      'text': 'Cours modifié',
      'backgroundColor': '#c7e6ff',
      'iconColor': '#43a7f7',
      'icon': FontAwesomeIcons.pencil,
    },
  };

  Widget eventIcon() {
    return Column(
      children: <Widget>[
        const SizedBox(height: 4),
        CircleAvatar(
          backgroundColor: ColorUtils.hexToColor(
            types[type]!['backgroundColor'] as String,
          ),
          child: Icon(
            types[type]!['icon'] as IconData?,
            size: 18,
            color: ColorUtils.hexToColor(types[type]!['iconColor'] as String),
          ),
        ),
      ],
    );
  }

  Widget infoText() {
    var text = AppDateUtils.eventDateTimeText(event.startsAt, event.endsAt);
    return Text(text, style: const TextStyle(fontSize: 14));
  }

  Widget locationText() {
    if (event.location == null || event.location!.isEmpty) {
      return const SizedBox.shrink();
    }

    return Row(
      children: <Widget>[
        const Icon(Icons.location_on, size: 14),
        const SizedBox(width: 5),
        Expanded(
          child: Text(event.location!, style: const TextStyle(fontSize: 14)),
        ),
      ],
    );
  }

  Widget changedDetails() {
    if (type != CalendarLogEventType.Changed || oldEvent == null) {
      return const SizedBox.shrink();
    }

    final changes = <String>[];

    // Check for time changes
    if (oldEvent!.startsAt != event.startsAt ||
        oldEvent!.endsAt != event.endsAt) {
      final oldTime = AppDateUtils.eventDateTimeText(
        oldEvent!.startsAt,
        oldEvent!.endsAt,
      );
      final newTime = AppDateUtils.eventDateTimeText(
        event.startsAt,
        event.endsAt,
      );
      changes.add('Horaire: $oldTime → $newTime');
    }

    // Check for location changes
    if (oldEvent!.location != event.location) {
      final oldLoc = oldEvent!.location ?? 'Non spécifié';
      final newLoc = event.location ?? 'Non spécifié';
      changes.add('Lieu: $oldLoc → $newLoc');
    }

    if (changes.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        ...changes.map(
          (change) => Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              change,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Use theme directly from context since settings provider is not yet migrated to Riverpod
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 15),
      child: Container(
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              eventIcon(),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      event.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      types[type]!['text'] as String,
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 10),
                    infoText(),
                    locationText(),
                    changedDetails(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
