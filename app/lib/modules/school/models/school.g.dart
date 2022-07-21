// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$_School _$$_SchoolFromJson(Map<String, dynamic> json) => _$_School(
      code: json['code'] as String,
      name: json['name'] as String,
      siteUrl: json['siteUrl'] as String,
      imageUrl: json['imageUrl'] as String,
      visible: json['visible'] as bool,
      intranetUrl: json['intranetUrl'] as String?,
      assistant:
          SchoolAssistant.fromJson(json['assistant'] as Map<String, dynamic>),
      fallbackAssistant: json['fallbackAssistant'] == null
          ? null
          : SchoolAssistant.fromJson(
              json['fallbackAssistant'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$_SchoolToJson(_$_School instance) => <String, dynamic>{
      'code': instance.code,
      'name': instance.name,
      'siteUrl': instance.siteUrl,
      'imageUrl': instance.imageUrl,
      'visible': instance.visible,
      'intranetUrl': instance.intranetUrl,
      'assistant': instance.assistant,
      'fallbackAssistant': instance.fallbackAssistant,
    };
