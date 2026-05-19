import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/event_details/providers/event_nb_checklist_items_provider.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';
import 'package:timecalendar/modules/onboarding/screens/onboarding_screen.dart';
import 'package:timecalendar/modules/personal_event/providers/personal_events_provider.dart';

void useSplashController(BuildContext context, WidgetRef ref) {
  void navigateTo() async {
    debugPrint('E2E-DIAG splash.navigateTo: start');
    final calendars = await ref.read(userCalendarProvider.future);

    final screen = calendars.length > 0
        ? TabsScreen.routeName
        : OnboardingScreen.routeName;

    debugPrint(
      'E2E-DIAG splash.navigateTo: calendars=${calendars.length} → $screen',
    );
    await Future.delayed(Duration(seconds: 1));
    debugPrint('E2E-DIAG splash.navigateTo: pushing $screen');
    Navigator.pushReplacementNamed(context, screen);
  }

  Future initAppData() async {
    debugPrint('E2E-DIAG splash.initAppData: start');
    await ref.read(userCalendarProvider.future);
    debugPrint('E2E-DIAG splash.initAppData: userCalendarProvider ok');
    await ref.read(calendarSyncServiceProvider).loadEventsFromDatabase();
    debugPrint('E2E-DIAG splash.initAppData: loadEventsFromDatabase ok');
    await ref.read(hiddenEventProvider.notifier).loadFromDatabase();
    debugPrint('E2E-DIAG splash.initAppData: hiddenEvent ok');
    await ref.read(eventNbChecklistItemsProvider.notifier).update();
    debugPrint('E2E-DIAG splash.initAppData: checklistItems ok');
    await ref.read(personalEventsProvider.notifier).refresh();
    debugPrint('E2E-DIAG splash.initAppData: personalEvents ok');
    navigateTo();
  }

  useEffect(() {
    initAppData();
    return null;
  }, []);
}
