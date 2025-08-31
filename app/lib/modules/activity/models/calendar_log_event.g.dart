// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_log_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CalendarLogEvent _$CalendarLogEventFromJson(Map<String, dynamic> json) =>
    _CalendarLogEvent(
      uid: json['uid'] as String,
      title: json['title'] as String,
      startsAt: DateTime.parse(json['startsAt'] as String),
      endsAt: DateTime.parse(json['endsAt'] as String),
      location: json['location'] as String?,
    );

Map<String, dynamic> _$CalendarLogEventToJson(_CalendarLogEvent instance) =>
    <String, dynamic>{
      'uid': instance.uid,
      'title': instance.title,
      'startsAt': instance.startsAt.toIso8601String(),
      'endsAt': instance.endsAt.toIso8601String(),
      'location': instance.location,
    };
