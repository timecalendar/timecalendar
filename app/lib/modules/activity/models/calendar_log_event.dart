import 'package:freezed_annotation/freezed_annotation.dart';

part 'calendar_log_event.freezed.dart';
part 'calendar_log_event.g.dart';

@freezed
abstract class CalendarLogEvent with _$CalendarLogEvent {
  const factory CalendarLogEvent({
    required String uid,
    required String title,
    required DateTime startsAt,
    required DateTime endsAt,
    String? location,
  }) = _CalendarLogEvent;

  factory CalendarLogEvent.fromJson(Map<String, dynamic> json) =>
      _$CalendarLogEventFromJson(json);

  factory CalendarLogEvent.fromInternalDb(Map<String, dynamic> map) {
    return CalendarLogEvent(
      uid: map['uid'],
      title: map['title'],
      startsAt: DateTime.parse(map['startsAt']).toLocal(),
      endsAt: DateTime.parse(map['endsAt']).toLocal(),
      location: map['location'],
    );
  }
}

extension CalendarLogEventExtension on CalendarLogEvent {
  Map<String, dynamic> toDbMap() {
    return {
      'uid': uid,
      'title': title,
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt.toUtc().toIso8601String(),
      'location': location,
    };
  }
}
