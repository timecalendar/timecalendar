import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:timecalendar/database/calendar_manager.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/models/difference.dart';
import 'package:timecalendar/utils/constants.dart';

class ActivityProvider with ChangeNotifier {
  List<Difference> activity = [];

  Future<void> loadActivity(int lastUpdate) async {
    try {
      await loadActivityFromDatabase();
      await fetchAndSetActivity(lastUpdate);
    } on Exception catch (error) {
      throw error;
    }
  }

  Future<void> loadActivityFromDatabase() async {
    activity = await DifferencesManager().getDifferences();
    print(activity);
    notifyListeners();
  }

  Future<void> fetchAndSetActivity(int lastUpdate) async {
    try {
      // Load calendar
      final selectedCalendar = await CalendarManager.loadCalendars();
      if (selectedCalendar.length == 0) return;
      // TODO: multicalendar - import all activities
      final body = selectedCalendar[0].getRequestMap();
      body['lastUpdate'] = lastUpdate;
      final rep = await http.post(
        Uri.parse(Constants.mainApiUrl + "activity"),
        body: jsonEncode(body),
      );

      List<dynamic> activityResponse = jsonDecode(rep.body);

      // Set activity
      var differencesManager = DifferencesManager();
      await differencesManager.addDifferences(
          activityResponse.map((item) => Difference.fromApi(item)).toList());

      // Load activity from database
      await loadActivityFromDatabase();
    } on Exception catch (error) {
      throw error;
    }
  }
}
