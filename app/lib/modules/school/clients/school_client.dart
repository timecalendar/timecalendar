import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:timecalendar/modules/dio/providers/dio_provider.dart';
import 'package:timecalendar/modules/school/models/school.dart';

part 'school_client.g.dart';

class SchoolClient {
  Reader _read;

  SchoolClient(this._read);

  Future<List<School>> fetchSchools() async {
    final result =
        await _read(dioProvider).get<Map<String, Object?>>('/schools');
    return FetchSchoolsResponse.fromJson(result.data!).schools;
  }
}

@JsonSerializable()
class FetchSchoolsResponse {
  final List<School> schools;

  FetchSchoolsResponse({required this.schools});

  factory FetchSchoolsResponse.fromJson(Map<String, Object?> json) =>
      _$FetchSchoolsResponseFromJson(json);
}
