import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:pref/pref.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/models/calendar_view_type.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/services/theme.dart';
import 'package:timecalendar/utils/color_utils.dart';
import 'package:enum_to_string/enum_to_string.dart';

class SettingsProvider with ChangeNotifier {
  static final SettingsProvider _instance = SettingsProvider._();
  SettingsProvider._();
  factory SettingsProvider() {
    return _instance;
  }

  PrefServiceShared _prefServiceShared;
  PrefServiceShared get prefServiceShared => _prefServiceShared;

  int _dateLimitDefault = 14;
  bool _notificationCalendarDefault = true;
  bool _colorsByGroupDefault = false;
  bool _newActivityDefault = false;
  double _calendarHourHeightDefault = 60;
  String _startupScreenDefault = 'home';
  bool _darkModeDefault = false;
  String _themeDefault = 'system';
  int _lastActivityUpdateDefault = 0;
  CalendarViewType _calendarViewTypeDefault = CalendarViewType.Week;
  bool _showWeekendsDefault = true;

  int _dateLimit;
  bool _notificationCalendar;
  bool _colorsByGroup;
  bool _newActivity;
  double _calendarHourHeight;
  String _startupScreen;
  bool _darkMode;
  String _theme;
  int _lastActivityUpdate;
  CalendarViewType _calendarViewType;
  bool _showWeekends;

  int _currentVersion;

  int get dateLimit => _dateLimit;
  bool get notificationCalendar => _notificationCalendar;
  bool get colorsByGroup => _colorsByGroup;
  bool get newActivity => _newActivity;
  double get calendarHourHeight => _calendarHourHeight;
  String get startupScreen => _startupScreen;
  bool get darkMode {
    if (_theme == 'system') {
      return SchedulerBinding.instance.window.platformBrightness ==
          Brightness.dark;
    } else if (_theme == 'light') {
      return false;
    }
    return true;
  }

  String get theme => _theme;
  int get lastActivityUpdate => _lastActivityUpdate;
  int get currentVersion => _currentVersion;
  CalendarViewType get calendarViewType => _calendarViewType;
  bool get showWeekends => _showWeekends;

  String version = '';
  String buildNumber = '';

  SharedPreferences prefs;

  Future<void> loadSettings([SharedPreferences prefs]) async {
    if (prefs != null) {
      this.prefs = prefs;
    }

    _dateLimit = this.prefs.getInt('date_limit');
    if (_dateLimit == null) {
      _dateLimit = _dateLimitDefault;
      await prefs.setInt('date_limit', _dateLimitDefault);
    }

    _notificationCalendar = this.prefs.getBool('notification_calendar');
    if (_notificationCalendar == null) {
      _notificationCalendar = _notificationCalendarDefault;
      await prefs.setBool(
          'notification_calendar', _notificationCalendarDefault);
    }

    _colorsByGroup = this.prefs.getBool('colors_by_group');
    if (_colorsByGroup == null) {
      _colorsByGroup = _colorsByGroupDefault;
      await prefs.setBool('colors_by_group', _colorsByGroupDefault);
    }

    _newActivity = this.prefs.getBool('new_activity');
    if (_newActivity == null) {
      _newActivity = _newActivityDefault;
      await prefs.setBool('new_activity', _newActivityDefault);
    }

    _newActivity = this.prefs.getBool('new_activity');
    if (_newActivity == null) {
      _newActivity = _newActivityDefault;
      await prefs.setBool('new_activity', _newActivityDefault);
    }

    _calendarHourHeight = this.prefs.getDouble('calendar_hour_height');
    if (_calendarHourHeight == null) {
      _calendarHourHeight = _calendarHourHeightDefault;
      await prefs.setDouble('calendar_hour_height', _calendarHourHeightDefault);
    }

    _startupScreen = this.prefs.getString('startup_screen');
    if (_startupScreen == null) {
      _startupScreen = _startupScreenDefault;
      await prefs.setString('startup_screen', _startupScreenDefault);
    }

    _darkMode = this.prefs.getBool('dark_mode');
    if (_darkMode == null) {
      _darkMode = _darkModeDefault;
      await prefs.setBool('dark_mode', _darkMode);
    }

    _theme = this.prefs.getString('theme');
    if (_theme == null) {
      // Set as dark if old is dark
      if (_darkMode) {
        _theme = 'dark';
      } else {
        _theme = _themeDefault;
      }
      await prefs.setString('theme', _theme);
    }

    _lastActivityUpdate = this.prefs.getInt('last_activity_update');
    if (_lastActivityUpdate == null) {
      _lastActivityUpdate = _lastActivityUpdateDefault;
      await prefs.setInt('last_activity_update', _lastActivityUpdate);
    }

    _currentVersion = this.prefs.getInt('current_version');
    if (_currentVersion == null) {
      _currentVersion = 0;
      await prefs.setInt('current_version', _currentVersion);
    }

    var stringPref = this.prefs.getString('calendar_view_type');
    _calendarViewType = stringPref != null
        ? EnumToString.fromString(CalendarViewType.values, stringPref)
        : null;
    if (_calendarViewType == null) {
      _calendarViewType = _calendarViewTypeDefault;
      await prefs.setString('calendar_view_type',
          EnumToString.convertToString(_calendarViewType));
    }

    _showWeekends = this.prefs.getBool('show_weekends');
    if (_showWeekends == null) {
      _showWeekends = _showWeekendsDefault;
      await prefs.setBool('show_weekends', _showWeekends);
    }

    PackageInfo packageInfo = await PackageInfo.fromPlatform();

    version = packageInfo.version;
    buildNumber = packageInfo.buildNumber;

    // PrefService
    this._prefServiceShared = await PrefServiceShared.init(defaults: {
      'date_limit': _dateLimitDefault,
      'notification_calendar': _notificationCalendar,
      'colors_by_group': _colorsByGroup,
      'new_activity': _newActivity,
      'calendar_hour_height': _calendarHourHeight,
      'startup_screen': _startupScreen,
      'dark_mode': _darkModeDefault,
      'theme': _themeDefault,
      'last_activity_update': _lastActivityUpdateDefault,
      'calendar_view_type': _calendarViewTypeDefault,
      'show_weekends': _showWeekendsDefault,
    });

    notifyListeners();
  }

  set newActivity(bool value) {
    _newActivity = value;
    notifyListeners();
    prefs.setBool('new_activity', value);
  }

  set calendarHourHeight(double value) {
    _calendarHourHeight = value;
    notifyListeners();
    prefs.setDouble('calendar_hour_height', value);
  }

  set lastActivityUpdate(int value) {
    _lastActivityUpdate = value;
    notifyListeners();
    prefs.setInt('last_activity_update', value);
  }

  set currentVersion(int version) {
    _currentVersion = version;
    notifyListeners();
    prefs.setInt('current_version', _currentVersion);
  }

  set calendarViewType(CalendarViewType value) {
    _calendarViewType = value;
    notifyListeners();
    prefs.setString('calendar_view_type', EnumToString.convertToString(value));
  }

  set showWeekends(bool value) {
    _showWeekends = value;
    notifyListeners();
    prefs.setBool('show_weekends', _showWeekends);
  }

  AppTheme get currentTheme {
    return darkMode ? AppTheme.darkTheme : AppTheme.lightTheme;
  }

  /// Returns the color of an event to be stored in the database.
  ///
  /// The color stored in the database is the one in light mode,
  /// if the user is in dark mode, we must lighten its color before storing it.
  Color getEventColorToSave(Color color) {
    if (this.darkMode) {
      color = ColorUtils.lightenEvent(color);
    }

    return color;
  }

  Color getEventColorToDisplay(Color color) {
    if (this.darkMode) {
      color = ColorUtils.darkenEvent(color);
    }

    return color;
  }

  Color getEventColor(Event event) {
    Color color = this.colorsByGroup ? event.groupColor : event.color;
    if (this.darkMode) {
      color = ColorUtils.darkenEvent(event.color);
    }
    return color;
  }
}
