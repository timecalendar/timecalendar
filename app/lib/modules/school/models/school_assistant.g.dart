// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_assistant.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$_SchoolAssistant _$$_SchoolAssistantFromJson(Map<String, dynamic> json) =>
    _$_SchoolAssistant(
      slug: json['slug'] as String,
      isNative: json['isNative'] as bool,
      requireIntranetAccess: json['requireIntranetAccess'] as bool,
      requireCalendarName: json['requireCalendarName'] as bool,
    );

Map<String, dynamic> _$$_SchoolAssistantToJson(_$_SchoolAssistant instance) =>
    <String, dynamic>{
      'slug': instance.slug,
      'isNative': instance.isNative,
      'requireIntranetAccess': instance.requireIntranetAccess,
      'requireCalendarName': instance.requireCalendarName,
    };
