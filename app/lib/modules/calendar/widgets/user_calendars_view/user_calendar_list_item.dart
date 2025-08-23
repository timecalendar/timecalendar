import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';

class UserCalendarListItem extends StatelessWidget {
  final UserCalendar calendar;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  const UserCalendarListItem({
    Key? key,
    required this.calendar,
    required this.onToggle,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final title = calendar.name.length > 0 ? calendar.name : 'Calendrier';
    final subtitle = calendar.schoolName ?? 'Calendrier personnel';

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: Switch(value: calendar.visible, onChanged: (_) => onToggle()),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: onDelete,
        ),
      ),
    );
  }
}
