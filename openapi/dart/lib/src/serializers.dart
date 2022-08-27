//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:timecalendar_api/src/date_serializer.dart';
import 'package:timecalendar_api/src/model/date.dart';

import 'package:timecalendar_api/src/model/calendar_event_for_public.dart';
import 'package:timecalendar_api/src/model/calendar_for_public.dart';
import 'package:timecalendar_api/src/model/calendar_with_content.dart';
import 'package:timecalendar_api/src/model/create_calendar_dto.dart';
import 'package:timecalendar_api/src/model/create_calendar_rep_dto.dart';
import 'package:timecalendar_api/src/model/find_school_groups_rep_dto.dart';
import 'package:timecalendar_api/src/model/find_schools_rep_dto.dart';
import 'package:timecalendar_api/src/model/get_school_groups_ical_url_dto.dart';
import 'package:timecalendar_api/src/model/get_school_groups_ical_url_rep_dto.dart';
import 'package:timecalendar_api/src/model/orleans_get_ical_url_from_student_number_dto.dart';
import 'package:timecalendar_api/src/model/school_assistant.dart';
import 'package:timecalendar_api/src/model/school_for_list.dart';
import 'package:timecalendar_api/src/model/school_group_item.dart';
import 'package:timecalendar_api/src/model/set_school_group_dto.dart';
import 'package:timecalendar_api/src/model/sync_calendars_dto.dart';

part 'serializers.g.dart';

@SerializersFor([
  CalendarEventForPublic,
  CalendarForPublic,
  CalendarWithContent,
  CreateCalendarDto,
  CreateCalendarRepDto,
  FindSchoolGroupsRepDto,
  FindSchoolsRepDto,
  GetSchoolGroupsIcalUrlDto,
  GetSchoolGroupsIcalUrlRepDto,
  OrleansGetIcalUrlFromStudentNumberDto,
  SchoolAssistant,
  SchoolForList,
  SchoolGroupItem,
  SetSchoolGroupDto,
  SyncCalendarsDto,
])
Serializers serializers = (_$serializers.toBuilder()
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(CalendarWithContent)]),
        () => ListBuilder<CalendarWithContent>(),
      )
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer()))
    .build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
