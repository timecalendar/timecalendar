// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_log.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CalendarLog _$CalendarLogFromJson(Map<String, dynamic> json) => _CalendarLog(
  id: json['id'] as String,
  calendarId: json['calendarId'] as String,
  calendarToken: json['calendarToken'] as String,
  calendarName: json['calendarName'] as String,
  calendarChange: CalendarChange.fromJson(
    json['calendarChange'] as Map<String, dynamic>,
  ),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$CalendarLogToJson(_CalendarLog instance) =>
    <String, dynamic>{
      'id': instance.id,
      'calendarId': instance.calendarId,
      'calendarToken': instance.calendarToken,
      'calendarName': instance.calendarName,
      'calendarChange': instance.calendarChange,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
