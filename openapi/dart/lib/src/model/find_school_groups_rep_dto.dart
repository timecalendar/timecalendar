//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_group_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'find_school_groups_rep_dto.g.dart';

/// FindSchoolGroupsRepDto
///
/// Properties:
/// * [groups]
@BuiltValue()
abstract class FindSchoolGroupsRepDto
    implements Built<FindSchoolGroupsRepDto, FindSchoolGroupsRepDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<SchoolGroupItem> get groups;

  FindSchoolGroupsRepDto._();

  factory FindSchoolGroupsRepDto(
          [void updates(FindSchoolGroupsRepDtoBuilder b)]) =
      _$FindSchoolGroupsRepDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FindSchoolGroupsRepDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FindSchoolGroupsRepDto> get serializer =>
      _$FindSchoolGroupsRepDtoSerializer();
}

class _$FindSchoolGroupsRepDtoSerializer
    implements PrimitiveSerializer<FindSchoolGroupsRepDto> {
  @override
  final Iterable<Type> types = const [
    FindSchoolGroupsRepDto,
    _$FindSchoolGroupsRepDto
  ];

  @override
  final String wireName = r'FindSchoolGroupsRepDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FindSchoolGroupsRepDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'groups';
    yield serializers.serialize(
      object.groups,
      specifiedType: const FullType(BuiltList, [FullType(SchoolGroupItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FindSchoolGroupsRepDto object, {
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
    required FindSchoolGroupsRepDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'groups':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(SchoolGroupItem)]),
          ) as BuiltList<SchoolGroupItem>;
          result.groups.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FindSchoolGroupsRepDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FindSchoolGroupsRepDtoBuilder();
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
