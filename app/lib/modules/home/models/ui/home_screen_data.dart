import 'package:timecalendar/modules/calendar/models/event_interface.dart';

class HomeScreenData {
  final List<EventInterface> events;
  final DateTime? dayDisplayedOnHomePage;

  HomeScreenData({required this.events, required this.dayDisplayedOnHomePage});
}
