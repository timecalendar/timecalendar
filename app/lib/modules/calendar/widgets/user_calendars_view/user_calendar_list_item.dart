import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/widgets/user_calendars_view/calendar_action_menu.dart';

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

  Future<bool?> _showDeleteConfirmation(BuildContext context) async {
    final title = calendar.name.length > 0 ? calendar.name : 'Calendrier';
    return await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirmer la suppression'),
          content: Text(
            'Êtes-vous sûr de vouloir supprimer le calendrier $title ?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Annuler',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text(
                'Supprimer',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (BuildContext context) {
        return CalendarActionMenu(
          calendar: calendar,
          onDelete: () async {
            final confirmed = await _showDeleteConfirmation(context);
            if (confirmed == true) {
              onDelete();
            }
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = calendar.name.length > 0 ? calendar.name : 'Calendrier';
    final subtitle = calendar.schoolName ?? 'Calendrier personnel';

    return Dismissible(
      key: Key('calendar_${calendar.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (direction) => _showDeleteConfirmation(context),
      onDismissed: (direction) => onDelete(),
      child: GestureDetector(
        onLongPress: () => _showDeleteMenu(context),
        child: ListTile(
          leading: Checkbox(
            value: calendar.visible,
            onChanged: (_) => onToggle(),
          ),
          title: Text(title),
          subtitle: Text(subtitle),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 4,
          ),
        ),
      ),
    );
  }
}
