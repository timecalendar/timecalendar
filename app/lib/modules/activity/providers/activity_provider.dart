import 'package:flutter/material.dart';
import 'package:timecalendar/modules/activity/models/difference.dart';

class ActivityProvider with ChangeNotifier {
  List<Difference> activity = [];

  Future<void> loadActivity(int lastUpdate) async {
    // TODO: Calendar activity
    // try {
    //   await loadActivityFromDatabase();
    //   await fetchAndSetActivity(lastUpdate);
    // } on Exception catch (error) {
    //   throw error;
    // }
  }

  Future<void> loadActivityFromDatabase() async {
    // TODO: Calendar activity
    // activity = await DifferenceRepository().getDifferences();
    // print(activity);
    // notifyListeners();
  }

  Future<void> fetchAndSetActivity(int lastUpdate) async {
    // TODO: Calendar activity
    // try {
    //   // Load calendar
    //   final selectedCalendar = await CalendarManager.loadCalendars();
    //   if (selectedCalendar.length == 0) return;
    //   final body = selectedCalendar[0].getRequestMap();
    //   body['lastUpdate'] = lastUpdate;
    //   final rep = await http.post(
    //     Uri.parse(Environment.oldApiUrl + "/activity"),
    //     body: jsonEncode(body),
    //   );

    //   List<dynamic> activityResponse = jsonDecode(rep.body);

    //   // Set activity
    //   var differencesManager = DifferenceRepository();
    //   await differencesManager.addDifferences(
    //       activityResponse.map((item) => Difference.fromApi(item)).toList());

    //   // Load activity from database
    //   await loadActivityFromDatabase();
    // } on Exception catch (error) {
    //   throw error;
    // }
  }
}
