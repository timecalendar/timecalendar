// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'school_client.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FetchSchoolsResponse _$FetchSchoolsResponseFromJson(
        Map<String, dynamic> json) =>
    FetchSchoolsResponse(
      schools: (json['schools'] as List<dynamic>)
          .map((e) => School.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$FetchSchoolsResponseToJson(
        FetchSchoolsResponse instance) =>
    <String, dynamic>{
      'schools': instance.schools,
    };
