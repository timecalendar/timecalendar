import 'package:flutter/material.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class TodayHeader extends StatelessWidget {
  final DateTime? dayDisplayedOnHomePage;

  const TodayHeader({
    Key? key,
    required this.dayDisplayedOnHomePage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(
              AppDateUtils.fullDayText(dayDisplayedOnHomePage),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
