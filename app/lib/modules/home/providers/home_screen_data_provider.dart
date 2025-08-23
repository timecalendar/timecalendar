import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/home/models/ui/home_screen_data.dart';
import 'package:timecalendar/modules/home/providers/home_events_provider.dart';

final homeScreenDataProvider = FutureProvider<HomeScreenData>((ref) async {
  final events = await ref.watch(homeEventsProvider.future);
  final day = await ref.watch(dayDisplayedOnHomePageProvider.future);
  return HomeScreenData(events: events, dayDisplayedOnHomePage: day);
});
