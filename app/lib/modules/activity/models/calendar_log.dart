import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar/modules/activity/models/calendar_change.dart';

part 'calendar_log.freezed.dart';
part 'calendar_log.g.dart';

@freezed
abstract class CalendarLog with _$CalendarLog {
  const factory CalendarLog({
    required String id,
    required String calendarId,
    required String calendarToken,
    required String calendarName,
    required CalendarChange calendarChange,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CalendarLog;

  factory CalendarLog.fromJson(Map<String, dynamic> json) =>
      _$CalendarLogFromJson(json);

  factory CalendarLog.fromInternalDb(Map<String, dynamic> map) {
    return CalendarLog(
      id: map['id'],
      calendarId: map['calendarId'],
      calendarToken: map['calendarToken'],
      calendarName: map['calendarName'],
      calendarChange: CalendarChange.fromInternalDb(map['calendarChange']),
      createdAt: DateTime.parse(map['createdAt']).toLocal(),
      updatedAt: DateTime.parse(map['updatedAt']).toLocal(),
    );
  }
}

extension CalendarLogExtension on CalendarLog {
  Map<String, dynamic> toDbMap() {
    return {
      'id': id,
      'calendarId': calendarId,
      'calendarToken': calendarToken,
      'calendarName': calendarName,
      'calendarChange': calendarChange.toDbMap(),
      'createdAt': createdAt.toUtc().toIso8601String(),
      'updatedAt': updatedAt.toUtc().toIso8601String(),
    };
  }
}
