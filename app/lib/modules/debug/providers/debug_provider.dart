import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';

final debugCalendarDetailsProvider = FutureProvider.autoDispose<String>((
  ref,
) async {
  final calendars = await ref.read(userCalendarProvider.future);
  return calendars.toString();
});
