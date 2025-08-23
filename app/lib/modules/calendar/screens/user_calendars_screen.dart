import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/calendar/widgets/user_calendars_view/user_calendar_list_item.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_screen.dart';

class UserCalendarsScreen extends HookConsumerWidget {
  static const routeName = '/user-calendars';

  const UserCalendarsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final calendars = ref.watch(userCalendarProvider);
    final notifier = ref.read(userCalendarProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Mes calendriers')),
      body: calendars.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erreur: $err')),
        data:
            (list) =>
                list.isEmpty
                    ? const Center(child: Text('Aucun calendrier importé.'))
                    : ListView.builder(
                      itemCount: list.length,
                      itemBuilder: (context, index) {
                        final calendar = list[index];
                        return UserCalendarListItem(
                          calendar: calendar,
                          onToggle: () => notifier.toggleVisibility(calendar),
                          onDelete: () => notifier.deleteCalendar(calendar.id),
                        );
                      },
                    ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).pushNamed(SelectSchool.routeName);
        },
        tooltip: 'Ajouter un calendrier',
        child: const Icon(Icons.add),
      ),
    );
  }
}
