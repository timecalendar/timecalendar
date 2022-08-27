//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_group_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'find_school_groups_rep_dto.g.dart';

/// FindSchoolGroupsRepDto
///
/// Properties:
/// * [groups]
abstract class FindSchoolGroupsRepDto
    implements Built<FindSchoolGroupsRepDto, FindSchoolGroupsRepDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<SchoolGroupItem> get groups;

  FindSchoolGroupsRepDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FindSchoolGroupsRepDtoBuilder b) => b;

  factory FindSchoolGroupsRepDto(
          [void updates(FindSchoolGroupsRepDtoBuilder b)]) =
      _$FindSchoolGroupsRepDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<FindSchoolGroupsRepDto> get serializer =>
      _$FindSchoolGroupsRepDtoSerializer();
}

class _$FindSchoolGroupsRepDtoSerializer
    implements StructuredSerializer<FindSchoolGroupsRepDto> {
  @override
  final Iterable<Type> types = const [
    FindSchoolGroupsRepDto,
    _$FindSchoolGroupsRepDto
  ];

  @override
  final String wireName = r'FindSchoolGroupsRepDto';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, FindSchoolGroupsRepDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'groups')
      ..add(serializers.serialize(object.groups,
          specifiedType:
              const FullType(BuiltList, [FullType(SchoolGroupItem)])));
    return result;
  }

  @override
  FindSchoolGroupsRepDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = FindSchoolGroupsRepDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'groups':
          final valueDes = serializers.deserialize(value,
                  specifiedType:
                      const FullType(BuiltList, [FullType(SchoolGroupItem)]))
              as BuiltList<SchoolGroupItem>;
          result.groups.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
