import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:timecalendar/database/calendar_manager.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/models/school.dart';
import 'package:timecalendar/models/school_assistant.dart';
import 'package:timecalendar/models/selected_calendar.dart';
import 'package:timecalendar/screens/add_grade_screen.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/screens/connect_screen.dart';
import 'package:timecalendar/screens/import_ical_screen.dart';
import 'package:timecalendar/utils/constants.dart';

class AssistantProvider with ChangeNotifier {
  String schoolCode;
  String schoolName = 'TimeCalendar';
  String gradeName = 'TimeCalendar';

  String websiteUrl;

  SchoolAssistant assistant;
  SchoolAssistant fallbackAssistant;

  bool useFallback = false;

  SchoolAssistant defaultAssistant = SchoolAssistant(
    code: 'select',
    isNative: false,
    needsConnection: true,
    needsGradeName: true,
  );

  SchoolAssistant get currentAssistant {
    if (useFallback && fallbackAssistant != null) return fallbackAssistant;
    if (assistant != null) return assistant;
    return defaultAssistant;
  }

  void initAssistant() {
    schoolCode = null;
    schoolName = null;
    gradeName = null;

    websiteUrl = null;

    assistant = null;
    fallbackAssistant = null;
    useFallback = false;
  }

  void initBySchool(School school) {
    initAssistant();
    schoolCode = school.code;
    schoolName = school.name;
    websiteUrl = school.calendarUrl;
    assistant = school.assistant;
    fallbackAssistant = school.fallbackAssistant;
  }

  String getAssistantStartScreen() {
    if (currentAssistant.needsGradeName) {
      return AddGradeScreen.routeName;
    }
    return getAssistantConnectionScreen();
  }

  String getAssistantConnectionScreen() {
    if (currentAssistant.needsConnection) {
      return ConnectScreen.routeName;
    }
    return AssistantScreen.routeName;
  }

  Future<void> setSelectedCalendar(SelectedCalendar calendar) async {
    // Set the custom calendar
    await CalendarManager.setCalendar(calendar);

    // Delete previous differences
    final differencesManager = DifferencesManager();
    await differencesManager.deleteAll();
  }

  /// Creates and saves a calendar from an ICal URL
  ///
  /// It creates a calendar corresponding to this URL on the server
  /// and saves it on the device.
  Future<void> createAndSaveCustomCalendar(String icalUrl) async {
    // Find a potential url ICal from TimeCalendar web
    var selectedCalendar = findSelectedCalendarFromUrl(icalUrl);

    if (selectedCalendar == null) {
      final body = {
        'url': icalUrl,
        'gradeName': gradeName,
      };

      if (schoolCode != null) {
        body['schoolCode'] = schoolCode;
      } else {
        body['schoolName'] = schoolName;
      }

      // Create the calendar
      final rep = await http.post(
        Uri.parse(Constants.mainApiUrl + "calendar/custom"),
        body: jsonEncode(body),
      );

      Map<String, Object> result = jsonDecode(rep.body);
      String token = result['token'];

      if (token == null || token.length == 0) {
        throw new Exception("Invalid token (${rep.body})");
      }

      // Create the selected calendar
      selectedCalendar = SelectedCalendar.fromToken(token);
    }

    await this.setSelectedCalendar(selectedCalendar);
  }

  void assistantCallback(BuildContext context, Map<String, dynamic> result) {
    if (result != null) {
      if (result['assistantDone'] != null) {
        Navigator.of(context).pushNamed(ImportIcalScreen.routeName,
            arguments: ImportIcalScreenArguments(false));
      } else if (result['fallback'] != null) {
        useFallback = true;
        Navigator.of(context).pushNamed(getAssistantStartScreen());
      }
    }
  }
}
