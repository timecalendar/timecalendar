// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_change.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CalendarChange _$CalendarChangeFromJson(Map<String, dynamic> json) =>
    _CalendarChange(
      oldItems: (json['oldItems'] as List<dynamic>)
          .map((e) => CalendarLogEvent.fromJson(e as Map<String, dynamic>))
          .toList(),
      newItems: (json['newItems'] as List<dynamic>)
          .map((e) => CalendarLogEvent.fromJson(e as Map<String, dynamic>))
          .toList(),
      changedItems: (json['changedItems'] as List<dynamic>)
          .map((e) => CalendarEventChange.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$CalendarChangeToJson(_CalendarChange instance) =>
    <String, dynamic>{
      'oldItems': instance.oldItems,
      'newItems': instance.newItems,
      'changedItems': instance.changedItems,
    };

_CalendarEventChange _$CalendarEventChangeFromJson(
  Map<String, dynamic> json,
) => _CalendarEventChange(
  oldEvent: CalendarLogEvent.fromJson(json['oldEvent'] as Map<String, dynamic>),
  newEvent: CalendarLogEvent.fromJson(json['newEvent'] as Map<String, dynamic>),
);

Map<String, dynamic> _$CalendarEventChangeToJson(
  _CalendarEventChange instance,
) => <String, dynamic>{
  'oldEvent': instance.oldEvent,
  'newEvent': instance.newEvent,
};
