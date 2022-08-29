import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/home/providers/home_events_provider.dart';
import 'package:timecalendar/modules/home/widgets/home_header.dart';
import 'package:timecalendar/modules/home/widgets/horizontal_events.dart';
import 'package:timecalendar/modules/home/widgets/today_events.dart';
import 'package:timecalendar/modules/home/widgets/today_header.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';

class HomeScreen extends HookConsumerWidget {
  static const routeName = '/home';

  final FirebaseAnalyticsObserver? observer;

  const HomeScreen({Key? key, this.observer}) : super(key: key);

  Future<void> refreshEvents(BuildContext context, WidgetRef ref) async {
    try {
      observer!.analytics.logEvent(
        name: 'refresh_calendar',
        parameters: {'action': 'home_pull'},
      );
      await ref.read(calendarSyncServiceProvider).syncCalendars();
    } on Exception catch (_) {
      showSnackBar(
        context,
        SnackBar(
          content: Text('Aucune connexion.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(homeEventsProvider);
    final dayDisplayedOnHomePage = ref.watch(dayDisplayedOnHomePageProvider);

    return SafeArea(
      child: Container(
        height: double.infinity,
        child: RefreshIndicator(
          child: ListView(
            children: <Widget>[
              SizedBox(height: 40),
              HomeHeader(
                  dayDisplayedOnHomePage: dayDisplayedOnHomePage,
                  events: events),
              SizedBox(height: 25),
              HorizontalEvents(events: events),
              SizedBox(height: 25),
              TodayHeader(dayDisplayedOnHomePage: dayDisplayedOnHomePage),
              SizedBox(height: 10),
              if (dayDisplayedOnHomePage != null)
                TodayEvents(
                  dayDisplayedOnHomePage: dayDisplayedOnHomePage,
                  events: events,
                ),
            ],
          ),
          onRefresh: () {
            return refreshEvents(context, ref);
          },
        ),
      ),
    );
  }
}
