import 'package:flutter/material.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class PlanningDayHeader extends StatelessWidget {
  final DateTime day;
  final bool hasEvents;

  const PlanningDayHeader({
    Key? key,
    required this.day,
    required this.hasEvents,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!hasEvents) return SizedBox.shrink();
    return Column(
      children: [
        Container(
          child: Center(
            child: Text(
              AppDateUtils.fullDayToShortDay(day).toUpperCase(),
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Color(0xffcccccc)
                    : Colors.black,
              ),
            ),
          ),
        ),
        Container(
          child: Center(
            child: Text(day.day.toString(), style: TextStyle(fontSize: 18)),
          ),
        ),
      ],
    );
  }
}
