import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/models/ui/calendar_view_type.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/firebase/services/notification/notification.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

enum CalendarOptions {
  Subscribe,
  Refresh,
  ChangeGroups,
  WeekView,
  PlanningView
}

class CalendarHeader extends StatelessWidget {
  const CalendarHeader({
    Key? key,
    required this.appBarHeight,
    required this.currentWeek,
    required this.currentDateTime,
    required this.showToday,
    required this.refreshCalendar,
    required this.changesGroup,
    required this.changeView,
  }) : super(key: key);

  final double appBarHeight;
  final int? currentWeek;
  final DateTime? currentDateTime;
  final Function showToday;
  final Function refreshCalendar;
  final Function changesGroup;
  final Function changeView;

  // ignore: missing_return
  PopupMenuItem<CalendarOptions> switchViewPopupMenuItem(
      SettingsProvider settings) {
    switch (settings.calendarViewType) {
      case CalendarViewType.Week:
        return PopupMenuItem(
          child: Text('Vue planning'),
          value: CalendarOptions.PlanningView,
        );
      case CalendarViewType.Planning:
        return PopupMenuItem(
          child: Text('Vue semaine'),
          value: CalendarOptions.WeekView,
        );
      default:
        throw Exception();
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);
    return Container(
      height: appBarHeight,
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 20,
          ),
          Expanded(
            child: Text(
              AppDateUtils.monthYearText(currentDateTime!),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.calendar_today,
            ),
            onPressed: () {
              showToday();
            },
            tooltip: 'Aujourd\'hui',
          ),
          PopupMenuButton(
            icon: Icon(
              Icons.more_vert,
            ),
            onSelected: (CalendarOptions selectedValue) {
              switch (selectedValue) {
                case CalendarOptions.Subscribe:
                  var notification = NotificationService();
                  notification.subscribe();
                  break;
                case CalendarOptions.Refresh:
                  refreshCalendar();
                  break;

                case CalendarOptions.ChangeGroups:
                  changesGroup();
                  break;

                case CalendarOptions.WeekView:
                  changeView(CalendarViewType.Week, settingsProvider);
                  break;

                case CalendarOptions.PlanningView:
                  changeView(CalendarViewType.Planning, settingsProvider);
                  break;

                default:
                  break;
              }
            },
            tooltip: 'Menu',
            itemBuilder: (_) => [
              PopupMenuItem(
                child: Text('Rafraîchir'),
                value: CalendarOptions.Refresh,
              ),
              PopupMenuItem(
                child: Text('Modifier les groupes'),
                value: CalendarOptions.ChangeGroups,
              ),
              switchViewPopupMenuItem(settingsProvider)
            ],
          ),
          SizedBox(
            width: 10,
          ),
        ],
      ),
    );
  }
}
