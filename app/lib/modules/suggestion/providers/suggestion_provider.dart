import 'package:flutter/material.dart';

class SuggestionProvider with ChangeNotifier {
  String? school;
  String? grade;
  String? lastUrl;

  bool isFailedSuggestion = false;

  Future<void> sendSuggestion(
    String? subject,
    String? description,
    String? email,
  ) async {
    // TODO: Suggestion
    // try {
    //   Map<String, Object?> body = {
    //     'subject': subject,
    //     'description': description,
    //     'email': email,
    //     'platform': 'Mobile'
    //   };
    //   // Load calendar
    //   final calendars = await CalendarManager.loadCalendars();

    //   if (!isFailedSuggestion && calendars.length > 0) {
    //     final calendar = calendars[0];
    //     body['mode'] = calendar.getMode();
    //     body['calendars'] = calendar.getCalendarIds();
    //   } else {
    //     body['mode'] = 'add_pending';
    //     if (school != null) {
    //       body['school'] = school;
    //     }
    //     if (grade != null) {
    //       body['grade'] = grade;
    //     }
    //     if (lastUrl != null) {
    //       body['calendars'] = lastUrl;
    //     }
    //   }

    //   var rep = await http.post(
    //     Uri.parse(Environment.oldApiUrl + "/report-problem"),
    //     body: jsonEncode(body),
    //   );
    //   if (rep.statusCode >= 400) {
    //     throw new Exception('Error');
    //   }
    // } on Exception catch (error) {
    //   throw error;
    // }
  }
}
