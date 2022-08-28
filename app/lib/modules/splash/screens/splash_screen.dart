import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/database/calendar_manager.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/onboarding/screens/onboarding_screen.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';

class SplashScreen extends StatefulWidget {
  static const routeName = '/';

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Future initData() async {
    final events = Provider.of<EventsProvider>(context, listen: false);
    // Load local events
    await events.loadEventsFromDatabase();
    events.loadEventByDay();
    // Wait splash screen
    await Future.delayed(Duration(seconds: 1));
    // Navigate to the next page
    navigateTo();
  }

  void navigateTo() async {
    final calendars = await CalendarManager.loadCalendars();
    if (calendars.length > 0) {
      Navigator.pushReplacementNamed(context, TabsScreen.routeName);
    } else {
      Navigator.pushReplacementNamed(context, OnboardingScreen.routeName);
    }
  }

  @override
  void initState() {
    super.initState();
    initData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Container(
              width: 150,
              child: Image.asset('assets/images/logo.png'),
            ),
          ],
        ),
      ),
    );
  }
}
