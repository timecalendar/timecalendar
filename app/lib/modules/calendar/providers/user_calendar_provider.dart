import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';

final userCalendarsProvider = StateProvider<List<UserCalendar>>((ref) => []);
