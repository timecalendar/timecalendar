import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/home/home_header.dart';
import 'package:timecalendar/widgets/home/horizontal_events.dart';
import 'package:timecalendar/widgets/home/today_events.dart';
import 'package:timecalendar/widgets/home/today_header.dart';

class HomeScreen extends StatelessWidget {
  static const routeName = '/home';

  final FirebaseAnalyticsObserver? observer;

  const HomeScreen({Key? key, this.observer}) : super(key: key);

  Future<void> refreshEvents(BuildContext context) async {
    try {
      observer!.analytics.logEvent(
          name: 'refresh_calendar', parameters: {'action': 'home_pull'});
      await Provider.of<EventsProvider>(context, listen: false)
          .fetchAndSetEvents();
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
  Widget build(BuildContext context) {
    var eventsProvider = Provider.of<EventsProvider>(context);
    var events = eventsProvider.homeEvents;
    var eventDay = eventsProvider.homeDay;

    return SafeArea(
      child: Container(
        height: double.infinity,
        child: RefreshIndicator(
          child: ListView(
            children: <Widget>[
              SizedBox(height: 40),
              HomeHeader(eventDay: eventDay, events: events),
              SizedBox(height: 25),
              HorizontalEvents(events: events),
              SizedBox(height: 25),
              TodayHeader(eventDay: eventDay),
              SizedBox(height: 10),
              TodayEvents(eventDay: eventDay, events: events),
            ],
          ),
          onRefresh: () {
            return refreshEvents(context);
          },
        ),
      ),
    );
  }
}
