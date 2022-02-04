import 'package:intl/intl.dart';

class AppDateUtils {
  static String dayText(DateTime? date, {bool showOn = false}) {
    if (date == null) return "";
    final yesterday = DateTime.now().subtract(Duration(days: 1));
    final today = DateTime.now();
    final tomorrow = DateTime.now().add(Duration(days: 1));
    if (sameDay(date, yesterday)) {
      return "hier";
    }
    if (sameDay(date, today)) {
      return "aujourd'hui";
    }
    if (sameDay(date, tomorrow)) {
      return "demain";
    }
    if (date.difference(today).inDays.abs() < 7) {
      return DateFormat("EEEE", "fr").format(date);
    }
    return fullDayText(date, showOn: showOn);
  }

  static String fullDayText(DateTime? date, {bool showOn = false}) {
    if (date == null) return "";
    return (showOn ? 'le ' : '') +
        DateFormat("EEEE", "fr").format(date) +
        ' ' +
        DateFormat.yMMMMd('fr').format(date);
  }

  static String calendarHeaderText(DateTime? date) {
    if (date == null) return "";
    return DateFormat("E dd/MM", "fr").format(date);
  }

  static String calendarWeekDayText(DateTime date) {
    return DateFormat("E", "fr").format(date).split("")[0].toUpperCase();
  }

  static String calendarDayNumberText(DateTime date) {
    return DateFormat("d", "fr").format(date);
  }

  static String monthText(DateTime date) {
    return DateFormat("MMMM", "fr").format(date);
  }

  static String monthYearText(DateTime date) {
    if (date.year == DateTime.now().year) {
      return DateFormat("MMMM", "fr").format(date);
    }
    return DateFormat("MMMM y", "fr").format(date);
  }

  static String eventDateTimeText(DateTime start, DateTime end) {
    return DateFormat.yMMMMd('fr').format(start) +
        '  •  ' +
        DateFormat.jm('fr').format(start) +
        ' - ' +
        DateFormat.jm('fr').format(end);
  }

  static String eventPlanningDateTimeText(DateTime start, DateTime end) {
    return DateFormat.jm('fr').format(start) +
        ' - ' +
        DateFormat.jm('fr').format(end);
  }

  static String fullDateTimeText(DateTime date) {
    return dayText(date) + ' à ' + DateFormat.jm('fr').format(date);
  }

  static bool isToday(DateTime date) {
    return sameDay(DateTime.now(), date);
  }

  static bool sameDay(DateTime? a, DateTime? b) {
    if (a == null || b == null) return false;
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  static String fullDayToShortDay(DateTime t) {
    return DateFormat("EEE", "fr").format(t);
  }

  static bool isSameDate(DateTime source, DateTime other) {
    return source.year == other.year &&
        source.month == other.month &&
        source.day == other.day;
  }

  static int currentWeek() {
    final today = DateTime.now();

    return dateToWeekNumber(today);
  }

  static int dateToWeekNumber(DateTime? dt) {
    for (var weekNumber = 0; weekNumber < 9999; weekNumber++) {
      var dayWeek = dayAtWeekNumber(weekNumber);
      if ((dt!.isAfter(dayWeek) || dt.isAtSameMomentAs(dayWeek)) &&
          dt.isBefore(dayWeek.add(Duration(days: 7)))) {
        return weekNumber;
      }
    }
    return -1;
  }

  static DateTime dayAtWeekNumber(int weekNumber) {
    var firstDay = DateTime(2000, 01, 01);

    while (firstDay.weekday != DateTime.monday) {
      firstDay = firstDay.add(Duration(days: 1));
    }

    return firstDay.add(Duration(days: 7 * weekNumber));
  }
}
