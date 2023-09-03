//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:timecalendar_api/src/model/school_group_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_school_group_dto.g.dart';

/// SetSchoolGroupDto
///
/// Properties:
/// * [groups]
/// * [icalUrl]
@BuiltValue()
abstract class SetSchoolGroupDto
    implements Built<SetSchoolGroupDto, SetSchoolGroupDtoBuilder> {
  @BuiltValueField(wireName: r'groups')
  BuiltList<SchoolGroupItem> get groups;

  @BuiltValueField(wireName: r'icalUrl')
  String get icalUrl;

  SetSchoolGroupDto._();

  factory SetSchoolGroupDto([void updates(SetSchoolGroupDtoBuilder b)]) =
      _$SetSchoolGroupDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetSchoolGroupDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetSchoolGroupDto> get serializer =>
      _$SetSchoolGroupDtoSerializer();
}

class _$SetSchoolGroupDtoSerializer
    implements PrimitiveSerializer<SetSchoolGroupDto> {
  @override
  final Iterable<Type> types = const [SetSchoolGroupDto, _$SetSchoolGroupDto];

  @override
  final String wireName = r'SetSchoolGroupDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SetSchoolGroupDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'groups';
    yield serializers.serialize(
      object.groups,
      specifiedType: const FullType(BuiltList, [FullType(SchoolGroupItem)]),
    );
    yield r'icalUrl';
    yield serializers.serialize(
      object.icalUrl,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SetSchoolGroupDto object, {
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
    required SetSchoolGroupDtoBuilder result,
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
        case r'icalUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.icalUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SetSchoolGroupDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SetSchoolGroupDtoBuilder();
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
