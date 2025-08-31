import 'package:timecalendar_api/timecalendar_api.dart' as api;

class CalendarEventCustomFields {
  bool? canceled;
  String? shortDescription;
  String? subject;
  String? groupColor;

  CalendarEventCustomFields({
    this.canceled,
    this.shortDescription,
    this.subject,
    this.groupColor,
  });

  CalendarEventCustomFields.fromApi(api.CalendarEventCustomFields fields)
    : canceled = fields.canceled,
      shortDescription = fields.shortDescription,
      subject = fields.subject,
      groupColor = fields.groupColor;

  CalendarEventCustomFields.fromInternalDb(Map<String, dynamic> map)
    : canceled = map['canceled'],
      shortDescription = map['shortDescription'],
      subject = map['subject'],
      groupColor = map['groupColor'];

  Map<String, dynamic> toDbMap() {
    return {
      'canceled': canceled,
      'shortDescription': shortDescription,
      'subject': subject,
      'groupColor': groupColor,
    };
  }
}
