//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_school_groups_ical_url_dto.g.dart';

/// GetSchoolGroupsIcalUrlDto
///
/// Properties:
/// * [groups]
@BuiltValue()
abstract class GetSchoolGroupsIcalUrlDto
    implements
        Built<GetSchoolGroupsIcalUrlDto, GetSchoolGroupsIcalUrlDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<String> get groups;

  GetSchoolGroupsIcalUrlDto._();

  factory GetSchoolGroupsIcalUrlDto(
          [void updates(GetSchoolGroupsIcalUrlDtoBuilder b)]) =
      _$GetSchoolGroupsIcalUrlDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetSchoolGroupsIcalUrlDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetSchoolGroupsIcalUrlDto> get serializer =>
      _$GetSchoolGroupsIcalUrlDtoSerializer();
}

class _$GetSchoolGroupsIcalUrlDtoSerializer
    implements PrimitiveSerializer<GetSchoolGroupsIcalUrlDto> {
  @override
  final Iterable<Type> types = const [
    GetSchoolGroupsIcalUrlDto,
    _$GetSchoolGroupsIcalUrlDto
  ];

  @override
  final String wireName = r'GetSchoolGroupsIcalUrlDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GetSchoolGroupsIcalUrlDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'groups';
    yield serializers.serialize(
      object.groups,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GetSchoolGroupsIcalUrlDto object, {
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
    required GetSchoolGroupsIcalUrlDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'groups':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
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
  GetSchoolGroupsIcalUrlDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GetSchoolGroupsIcalUrlDtoBuilder();
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
