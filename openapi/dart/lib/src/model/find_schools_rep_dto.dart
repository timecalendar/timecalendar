//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_for_list.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'find_schools_rep_dto.g.dart';

/// FindSchoolsRepDto
///
/// Properties:
/// * [schools]
@BuiltValue()
abstract class FindSchoolsRepDto
    implements Built<FindSchoolsRepDto, FindSchoolsRepDtoBuilder> {
  @BuiltValueField(wireName: r'schools')
  BuiltList<SchoolForList> get schools;

  FindSchoolsRepDto._();

  factory FindSchoolsRepDto([void updates(FindSchoolsRepDtoBuilder b)]) =
      _$FindSchoolsRepDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FindSchoolsRepDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FindSchoolsRepDto> get serializer =>
      _$FindSchoolsRepDtoSerializer();
}

class _$FindSchoolsRepDtoSerializer
    implements PrimitiveSerializer<FindSchoolsRepDto> {
  @override
  final Iterable<Type> types = const [FindSchoolsRepDto, _$FindSchoolsRepDto];

  @override
  final String wireName = r'FindSchoolsRepDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FindSchoolsRepDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'schools';
    yield serializers.serialize(
      object.schools,
      specifiedType: const FullType(BuiltList, [FullType(SchoolForList)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FindSchoolsRepDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FindSchoolsRepDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'schools':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SchoolForList)]),
          ) as BuiltList<SchoolForList>;
          result.schools.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FindSchoolsRepDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FindSchoolsRepDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
