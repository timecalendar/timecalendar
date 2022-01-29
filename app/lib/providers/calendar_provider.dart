import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

class CalendarProvider with ChangeNotifier {
  int savedWeek;
  DateTime currentDay;
  ValueNotifier<DateTime> _currentDayNotifier;
  double savedScrollOffset;
  bool isLoaded = false;

  ValueNotifier<DateTime> get currentDayNotifier => _currentDayNotifier;

  setCurrentDayNotifier(DateTime currentDay) {
    currentDay = currentDay;
    _currentDayNotifier.value = currentDay;
    notifyListeners();
  }

  CalendarProvider() {
    currentDay = DateTime.now();
    _currentDayNotifier = ValueNotifier(currentDay);
  }
}
