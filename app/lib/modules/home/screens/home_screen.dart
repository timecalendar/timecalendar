import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/home/providers/home_screen_data_provider.dart';
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
      await ref.read(calendarSyncServiceProvider).syncAndLoadCalendars();
    } on Exception catch (_) {
      showSnackBar(context, SnackBar(content: Text('Aucune connexion.')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeScreenData = ref.watch(homeScreenDataProvider);

    return SafeArea(
      child: Container(
        height: double.infinity,
        child: RefreshIndicator(
          child: homeScreenData.when(
            data:
                (data) => ListView(
                  children: <Widget>[
                    SizedBox(height: 40),
                    HomeHeader(
                      dayDisplayedOnHomePage: data.dayDisplayedOnHomePage,
                      events: data.events,
                    ),
                    SizedBox(height: 25),
                    HorizontalEvents(events: data.events),
                    SizedBox(height: 25),
                    TodayHeader(
                      dayDisplayedOnHomePage: data.dayDisplayedOnHomePage,
                    ),
                    SizedBox(height: 10),
                    if (data.dayDisplayedOnHomePage != null)
                      TodayEvents(
                        dayDisplayedOnHomePage: data.dayDisplayedOnHomePage!,
                        events: data.events,
                      ),
                  ],
                ),
            loading: () => Center(child: CircularProgressIndicator()),
            error:
                (e, st) =>
                    Center(child: Text('Error loading home screen data')),
          ),
          onRefresh: () {
            return refreshEvents(context, ref);
          },
        ),
      ),
    );
  }
}
