import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/legacy.dart';

final calendarProvider = ChangeNotifierProvider<CalendarProvider>(
  (ref) => CalendarProvider(),
);

class CalendarProvider with ChangeNotifier {
  int? savedWeek;
  DateTime? currentDay;
  ValueNotifier<DateTime?>? _currentDayNotifier;
  double? savedScrollOffset;

  ValueNotifier<DateTime?>? get currentDayNotifier => _currentDayNotifier;

  setCurrentDayNotifier(DateTime currentDay) {
    currentDay = currentDay;
    _currentDayNotifier!.value = currentDay;
    notifyListeners();
  }

  CalendarProvider() {
    currentDay = DateTime.now();
    _currentDayNotifier = ValueNotifier(currentDay);
  }
}
