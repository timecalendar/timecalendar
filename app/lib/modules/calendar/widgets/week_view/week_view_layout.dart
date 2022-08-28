import 'dart:math';

import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/controllers/sync_scroll_controller.dart';
import 'package:timecalendar/modules/calendar/providers/calendar_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';
import 'package:timecalendar/modules/calendar/controllers/snapping_list_scroll_physics.dart';
import 'package:timecalendar/modules/calendar/widgets/week_view/calendar_hours_column.dart';
import 'package:timecalendar/modules/calendar/widgets/week_view/calendar_week.dart';

class WeekViewLayout extends StatefulWidget {
  const WeekViewLayout(
      {Key? key,
      required this.screenHeight,
      required this.calendarWidth,
      required this.leftHoursWidth,
      required this.startHour,
      required this.endHour,
      required this.nbOfVisibleDays,
      required this.observer,
      required this.updateCurrentWeek,
      required this.currentWeek});

  final double screenHeight;
  final double calendarWidth;
  final double leftHoursWidth;
  final int startHour;
  final int endHour;
  final int nbOfVisibleDays;

  final int? currentWeek;
  final ValueChanged<int> updateCurrentWeek;

  final FirebaseAnalyticsObserver? observer;

  @override
  _WeekViewLayoutState createState() => _WeekViewLayoutState();
}

class _WeekViewLayoutState extends State<WeekViewLayout> {
  SyncScrollController? _syncScroll;

  ScrollController? _weekScrollController;
  ScrollController? _hourScrollController;

  final headerHeight = 60.0;

  final columnGap = 2.0;

  final columnPaddingTop = 8.0;

  var hourHeight = 60.0;

  var _isInit = false;

  late var _previousHourHeight;
  late var _previousScrollOffset;

  late CalendarProvider calendarProvider;

  double get minHourHeight {
    var totalHours = widget.endHour - widget.startHour - 1;
    return max(30, (calendarHeight - headerHeight) / totalHours);
  }

  double get maxHourHeight {
    return (calendarHeight - headerHeight) * 0.15;
  }

  double get calendarHeight {
    return widget.screenHeight - headerHeight;
  }

  int get nbHours {
    return widget.endHour - widget.startHour;
  }

  @override
  void initState() {
    super.initState();

    calendarProvider = Provider.of<CalendarProvider>(context, listen: false);

    calendarProvider.currentDayNotifier!.addListener(onCurrentDayChange);

    _syncScroll = SyncScrollController([]);

    // // Load the saved week (if the user changed tab)
    // var savedWeek = calendarProvider.savedWeek;
    // if (savedWeek != null) {
    //   widget.updateCurrentWeek(savedWeek);
    // } else {
    //   widget.updateCurrentWeek(AppDateUtils.currentWeek());
    // }

    // Load the saved scroll offset
    var savedScrollOffset = calendarProvider.savedScrollOffset;
    if (savedScrollOffset != null) {
      _syncScroll!.currentOffset = savedScrollOffset;
      _hourScrollController =
          ScrollController(initialScrollOffset: savedScrollOffset);
    } else {
      _hourScrollController = ScrollController();
    }

    // Init hour controller
    _syncScroll!.registerScrollController(_hourScrollController);

    // Vertical scroll listener
    _syncScroll!.addListener(onVerticalScroll);

    Future.delayed(Duration.zero).then((_) {
      widget.observer!.analytics.logEvent(name: 'view_calendar');
    });
    loadCalendarUIPreferences();
  }

  void _onWeekPageScroll() {
    var week = (_weekScrollController!.offset / widget.calendarWidth).floor();
    if (week != widget.currentWeek) {
      // Save the current week in our provider
      Provider.of<CalendarProvider>(context, listen: false).savedWeek = week;
      setState(() {
        widget.updateCurrentWeek(
            (_weekScrollController!.offset / widget.calendarWidth).floor());
      });
    }
  }

  void onVerticalScroll(double offset) {
    calendarProvider.savedScrollOffset = offset;
  }

  @override
  void dispose() {
    _syncScroll!.removeListener(onVerticalScroll);
    calendarProvider.currentDayNotifier!.removeListener(onCurrentDayChange);
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    if (!_isInit) {
      _isInit = true;
      _weekScrollController = ScrollController(
          initialScrollOffset: widget.calendarWidth * widget.currentWeek!);
      _weekScrollController!.addListener(_onWeekPageScroll);
    }
  }

  void onCurrentDayChange() {
    print(calendarProvider.currentDayNotifier!.value);
    _weekScrollController!.animateTo(
        widget.calendarWidth *
            AppDateUtils.dateToWeekNumber(
                calendarProvider.currentDayNotifier!.value),
        duration: Duration(milliseconds: 500),
        curve: Curves.easeIn);
  }

  void loadCalendarUIPreferences() async {
    setState(() {
      hourHeight = Provider.of<SettingsProvider>(context, listen: false)
          .calendarHourHeight;
    });
  }

  void _onScaleStart(ScaleStartDetails scaleDetails) {
    _previousHourHeight = hourHeight;
    _previousScrollOffset = _syncScroll!.currentOffset;
  }

  void _onScaleUpdate(ScaleUpdateDetails scaleDetails) {
    double focusedY = scaleDetails.localFocalPoint.dy - headerHeight;
    double diffY = focusedY + _syncScroll!.currentOffset;
    double offsetY =
        _previousScrollOffset + diffY * scaleDetails.verticalScale - diffY;
    double newHourHeight = min(maxHourHeight,
        max(minHourHeight, _previousHourHeight * scaleDetails.verticalScale));
    _syncScroll!.jumpTo(offsetY);

    setState(() {
      hourHeight = newHourHeight;
    });
  }

  Future _onScaleEnd(ScaleEndDetails scaleDetails) async {
    Provider.of<SettingsProvider>(context, listen: false).calendarHourHeight =
        hourHeight;
  }

  @override
  Widget build(BuildContext context) {
    // var settingsProvider = Provider.of<SettingsProvider>(context);
    final dayWidth = widget.calendarWidth / widget.nbOfVisibleDays;
    final scrollPhysics = SnappingListScrollPhysics(
        mainAxisStartPadding: 0, itemExtent: widget.calendarWidth);

    return Row(
      children: <Widget>[
        new CalendarHoursColumn(
          screenHeight: widget.screenHeight,
          leftHoursWidth: widget.leftHoursWidth,
          headerHeight: headerHeight,
          calendarHeight: calendarHeight,
          hourScrollController: _hourScrollController,
          hourHeight: hourHeight,
          nbHours: nbHours,
          startHour: widget.startHour,
          syncScroll: _syncScroll,
        ),
        Container(
          height: widget.screenHeight,
          width: widget.calendarWidth,
          child: ListView.builder(
            itemExtent: widget.calendarWidth,
            scrollDirection: Axis.horizontal,
            controller: _weekScrollController,
            physics: scrollPhysics,
            itemBuilder: (ctx, index) {
              return Consumer<EventsProvider>(
                builder: (context, events, child) {
                  return GestureDetector(
                    onScaleStart: _onScaleStart,
                    onScaleUpdate: _onScaleUpdate,
                    onScaleEnd: _onScaleEnd,
                    child: CalendarWeek(
                      screenHeight: widget.screenHeight,
                      calendarWidth: widget.calendarWidth,
                      headerHeight: headerHeight,
                      nbOfVisibleDays: widget.nbOfVisibleDays,
                      firstDayOfWeek: AppDateUtils.dayAtWeekNumber(index),
                      dayWidth: dayWidth,
                      startHour: widget.startHour,
                      calendarHeight: calendarHeight,
                      hourHeight: hourHeight,
                      nbHours: nbHours,
                      columnGap: columnGap,
                      syncScroll: _syncScroll,
                      weekEvents: events.getWeekEvents(index),
                      columnPaddingTop: columnPaddingTop,
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
