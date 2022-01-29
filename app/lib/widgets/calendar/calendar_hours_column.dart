import 'package:flutter/material.dart';
import 'package:timecalendar/controllers/calendar/sync_scroll_controller.dart';

class CalendarHoursColumn extends StatelessWidget {
  const CalendarHoursColumn({
    Key key,
    @required this.screenHeight,
    @required this.leftHoursWidth,
    @required this.headerHeight,
    @required this.calendarHeight,
    @required ScrollController hourScrollController,
    @required this.hourHeight,
    @required this.nbHours,
    @required this.startHour,
    @required SyncScrollController syncScroll,
  }) : _hourScrollController = hourScrollController, _syncScroll = syncScroll, super(key: key);

  final double screenHeight;
  final double leftHoursWidth;
  final double headerHeight;
  final double calendarHeight;
  final ScrollController _hourScrollController;
  final double hourHeight;
  final int nbHours;
  final int startHour;
  final SyncScrollController _syncScroll;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: screenHeight,
      width: leftHoursWidth,
      child: Column(
        children: <Widget>[
          Container(
            height: headerHeight,
            width: leftHoursWidth,
          ),
          Container(
            height: calendarHeight,
            width: leftHoursWidth,
            child: NotificationListener<ScrollNotification>(
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  physics: const AlwaysScrollableScrollPhysics(),
                  controller: _hourScrollController,
                  child: Container(
                    height: hourHeight * nbHours,
                    width: leftHoursWidth,
                    child: Stack(
                      children: <Widget>[
                        for (var hour = 0; hour < nbHours; hour++)
                          Positioned(
                            top: hourHeight * hour,
                            left: 10,
                            child: Text(
                              (hour + startHour > 9 ? '' : '0') +
                                  '${hour + startHour}:00',
                              style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                onNotification: (ScrollNotification scrollInfo) {
                  _syncScroll.processNotification(
                      scrollInfo, _hourScrollController);
                  return;
                }),
          ),
        ],
      ),
    );
  }
}
