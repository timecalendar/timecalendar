import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/debug/components/calendar_details.dart';
import 'package:timecalendar/modules/debug/providers/debug_provider.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class DebugScreen extends HookConsumerWidget {
  static const routeName = '/debug';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Debug page'),
      ),
      body: Padding(
        padding: EdgeInsets.all(8.0),
        child: Column(
          children: [
            CalendarDetails(),
            CustomButton(
                text: 'Reset calendar',
                onPressed: () async {
                  await ref
                      .read(userCalendarRepositoryProvider)
                      .clearUserCalendars();

                  ref.invalidate(debugCalendarDetailsProvider);
                })
          ],
        ),
      ),
    );
  }
}
