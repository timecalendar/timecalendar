import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/calendar_view_type.dart';
import 'package:timecalendar/providers/calendar_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/modules/school/screens/school_selection_screen.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/utils/date_utils.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/calendar/calendar.dart';
import 'package:timecalendar/widgets/calendar/calendar_header.dart';
import 'package:timecalendar/widgets/calendar/planning.dart';

class CalendarScreen extends StatefulWidget {
  static const routeName = '/';
  final BuildContext parentContext;
  final FirebaseAnalyticsObserver observer;

  const CalendarScreen({Key key, this.parentContext, this.observer})
      : super(key: key);

  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  int _currentWeek;

  final startHour = 7;

  final endHour = 21;

  final leftHoursWidth = 50.0;

  final appBarHeight = 60.0;

  var _isLoading = false;

  CalendarProvider calendarProvider;

  void refreshCalendar() async {
    setState(() {
      _isLoading = true;
    });
    try {
      widget.observer.analytics.logEvent(
        name: 'refresh_calendar',
        parameters: {'action': 'calendar_menu_bar'},
      );
      await Provider.of<EventsProvider>(context, listen: false)
          .fetchAndSetEvents();
      hideSnackBar(context);
      showSnackBar(
        context,
        SnackBar(
          content: Text('Calendrier rechargé.'),
        ),
      );
    } on Exception catch (_) {
      hideSnackBar(context);
      showSnackBar(
        context,
        SnackBar(
          content: Text('Aucune connexion.'),
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void changesGroup() {
    Navigator.pushNamed(context, SelectSchool.routeName);
  }

  void showToday() {
    calendarProvider.setCurrentDayNotifier(DateTime.now());
  }

  void changeView(
      CalendarViewType calendarViewType, SettingsProvider settingsProvider) {
    settingsProvider.calendarViewType = calendarViewType;
  }

  // can be deleted
  double get screenHeight {
    final mediaQuery = MediaQuery.of(context);
    return mediaQuery.size.height -
        mediaQuery.padding.top -
        appBarHeight -
        TabsScreen.navigationBarHeight -
        MediaQuery.of(widget.parentContext).padding.bottom;
  }

  double get screenWidth {
    final mediaQuery = MediaQuery.of(context);
    return mediaQuery.size.width;
  }

  // can be deleted
  double get calendarWidth {
    return screenWidth - leftHoursWidth;
  }

  @override
  void initState() {
    super.initState();

    calendarProvider = Provider.of<CalendarProvider>(context, listen: false);
    // Load the saved week (if the user changed tab)
    _currentWeek = AppDateUtils.dateToWeekNumber(calendarProvider.currentDay);
  }

  _updateCurrentWeek(int currentWeek) {
    calendarProvider.currentDay = AppDateUtils.dayAtWeekNumber(currentWeek);
    setState(() {
      _currentWeek = currentWeek;
    });
  }

  _updateCurrentDay(DateTime dateTime) {
    setState(() {
      calendarProvider.currentDay = dateTime;
      _currentWeek = AppDateUtils.dateToWeekNumber(dateTime);
    });
  }

  Widget calendarView(SettingsProvider settingsProvider) {
    switch (settingsProvider.calendarViewType) {
      case CalendarViewType.Planning:
        return Expanded(
          child: Planning(
            currentWeek: _currentWeek,
            updateCurrentWeek: _updateCurrentWeek,
            updateCurrentDay: _updateCurrentDay,
          ),
        );
        break;
      case CalendarViewType.Week:
        return Calendar(
          currentWeek: _currentWeek,
          screenHeight: screenHeight,
          calendarWidth: calendarWidth,
          startHour: startHour,
          endHour: endHour,
          nbOfVisibleDays: settingsProvider.showWeekends ? 7 : 5,
          observer: widget.observer,
          leftHoursWidth: leftHoursWidth,
          updateCurrentWeek: _updateCurrentWeek,
        );
        break;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context, listen: true);
    var calendarProvider = Provider.of<CalendarProvider>(context);
    return SafeArea(
      child: Stack(
        children: <Widget>[
          Column(
            mainAxisSize: MainAxisSize.max,
            children: <Widget>[
              CalendarHeader(
                appBarHeight: appBarHeight,
                showToday: showToday,
                currentWeek: _currentWeek,
                refreshCalendar: refreshCalendar,
                changesGroup: changesGroup,
                changeView: changeView,
                currentDateTime: calendarProvider.currentDay,
              ),
              calendarView(settingsProvider)
            ],
          ),
          if (_isLoading)
            new Center(
              child: new CircularProgressIndicator(
                valueColor: null,
              ),
            ),
        ],
      ),
    );
  }
}
