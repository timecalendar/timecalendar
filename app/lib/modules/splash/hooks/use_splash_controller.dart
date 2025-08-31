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
    final calendars = await ref.read(userCalendarProvider.future);

    final screen = calendars.length > 0
        ? TabsScreen.routeName
        : OnboardingScreen.routeName;

    await Future.delayed(Duration(seconds: 1));
    Navigator.pushReplacementNamed(context, screen);
  }

  Future initAppData() async {
    await ref.read(userCalendarProvider.future);
    await ref.read(calendarSyncServiceProvider).loadEventsFromDatabase();
    await ref.read(hiddenEventProvider.notifier).loadFromDatabase();
    await ref.read(eventNbChecklistItemsProvider.notifier).update();
    await ref.read(personalEventsProvider.notifier).refresh();
    navigateTo();
  }

  useEffect(() {
    initAppData();
    return null;
  }, []);
}
