//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_for_list.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'find_schools_rep_dto.g.dart';

/// FindSchoolsRepDto
///
/// Properties:
/// * [schools]
abstract class FindSchoolsRepDto
    implements Built<FindSchoolsRepDto, FindSchoolsRepDtoBuilder> {
  @BuiltValueField(wireName: r'schools')
  BuiltList<SchoolForList> get schools;

  FindSchoolsRepDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FindSchoolsRepDtoBuilder b) => b;

  factory FindSchoolsRepDto([void updates(FindSchoolsRepDtoBuilder b)]) =
      _$FindSchoolsRepDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<FindSchoolsRepDto> get serializer =>
      _$FindSchoolsRepDtoSerializer();
}

class _$FindSchoolsRepDtoSerializer
    implements StructuredSerializer<FindSchoolsRepDto> {
  @override
  final Iterable<Type> types = const [FindSchoolsRepDto, _$FindSchoolsRepDto];

  @override
  final String wireName = r'FindSchoolsRepDto';

  @override
  Iterable<Object?> serialize(Serializers serializers, FindSchoolsRepDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'schools')
      ..add(serializers.serialize(object.schools,
          specifiedType: const FullType(BuiltList, [FullType(SchoolForList)])));
    return result;
  }

  @override
  FindSchoolsRepDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = FindSchoolsRepDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'schools':
          final valueDes = serializers.deserialize(value,
                  specifiedType:
                      const FullType(BuiltList, [FullType(SchoolForList)]))
              as BuiltList<SchoolForList>;
          result.schools.replace(valueDes);
          break;
      }
    }
    return result.build();
  }
}
