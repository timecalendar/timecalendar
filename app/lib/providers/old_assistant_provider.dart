import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/database/calendar_manager.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/models/selected_calendar.dart';

class OldAssistantProvider with ChangeNotifier {
  String? schoolCode;
  String? schoolName = 'TimeCalendar';
  String? gradeName = 'TimeCalendar';

  String? websiteUrl;

  // SchoolAssistant? assistant;
  // SchoolAssistant? fallbackAssistant;

  bool useFallback = false;

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
        Uri.parse(Environment.oldApiUrl + "/calendar/custom"),
        body: jsonEncode(body),
      );

      Map<String, dynamic> result = jsonDecode(rep.body);
      String? token = result['token'] as String?;

      if (token == null || token.length == 0) {
        throw new Exception("Invalid token (${rep.body})");
      }

      // Create the selected calendar
      selectedCalendar = SelectedCalendar.fromToken(token);
    }

    await this.setSelectedCalendar(selectedCalendar);
  }
}
