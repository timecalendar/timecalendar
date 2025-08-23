import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';

class CalendarActionMenu extends StatelessWidget {
  final UserCalendar calendar;
  final VoidCallback onDelete;

  const CalendarActionMenu({
    Key? key,
    required this.calendar,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final title = calendar.name.length > 0 ? calendar.name : 'Calendrier';
    final subtitle = calendar.schoolName ?? 'Calendrier personnel';

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with calendar info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          // Action items
          ListTile(
            leading: const Icon(Icons.delete, color: Colors.red),
            title: const Text('Supprimer le calendrier'),
            onTap: () {
              Navigator.pop(context);
              onDelete();
            },
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
