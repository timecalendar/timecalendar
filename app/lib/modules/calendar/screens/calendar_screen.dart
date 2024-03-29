import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:timecalendar/modules/calendar/models/ui/calendar_view_type.dart';
import 'package:timecalendar/modules/calendar/providers/calendar_provider.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/calendar/widgets/common/calendar_header.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_view_layout.dart';
import 'package:timecalendar/modules/calendar/widgets/week_view/week_view_layout.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  static const routeName = '/';
  final BuildContext? parentContext;
  final FirebaseAnalyticsObserver? observer;

  const CalendarScreen({Key? key, this.parentContext, this.observer})
      : super(key: key);

  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  int? _currentWeek;

  final startHour = 7;

  final endHour = 21;

  final leftHoursWidth = 50.0;

  final appBarHeight = 60.0;

  var _isLoading = false;

  late CalendarProvider calendarProvider;

  void refreshCalendar() async {
    setState(() {
      _isLoading = true;
    });
    try {
      widget.observer!.analytics.logEvent(
        name: 'refresh_calendar',
        parameters: {'action': 'calendar_menu_bar'},
      );
      await ref.read(calendarSyncServiceProvider).syncCalendars();
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
        MediaQuery.of(widget.parentContext!).padding.bottom;
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

    calendarProvider =
        oldprovider.Provider.of<CalendarProvider>(context, listen: false);
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
          child: PlanningViewLayout(
            currentWeek: _currentWeek,
            updateCurrentWeek: _updateCurrentWeek,
            updateCurrentDay: _updateCurrentDay,
          ),
        );
      case CalendarViewType.Week:
        return WeekViewLayout(
          currentWeek: _currentWeek,
          screenHeight: screenHeight,
          calendarWidth: calendarWidth,
          startHour: startHour,
          endHour: endHour,
          nbOfVisibleDays: settingsProvider.showWeekends! ? 7 : 5,
          observer: widget.observer,
          leftHoursWidth: leftHoursWidth,
          updateCurrentWeek: _updateCurrentWeek,
        );
      default:
        throw Exception();
    }
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider =
        oldprovider.Provider.of<SettingsProvider>(context, listen: true);
    var calendarProvider = oldprovider.Provider.of<CalendarProvider>(context);
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
