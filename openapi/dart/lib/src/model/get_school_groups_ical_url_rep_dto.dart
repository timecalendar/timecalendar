//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'get_school_groups_ical_url_rep_dto.g.dart';

/// GetSchoolGroupsIcalUrlRepDto
///
/// Properties:
/// * [url]
@BuiltValue()
abstract class GetSchoolGroupsIcalUrlRepDto
    implements
        Built<GetSchoolGroupsIcalUrlRepDto,
            GetSchoolGroupsIcalUrlRepDtoBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  GetSchoolGroupsIcalUrlRepDto._();

  factory GetSchoolGroupsIcalUrlRepDto(
          [void updates(GetSchoolGroupsIcalUrlRepDtoBuilder b)]) =
      _$GetSchoolGroupsIcalUrlRepDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GetSchoolGroupsIcalUrlRepDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<GetSchoolGroupsIcalUrlRepDto> get serializer =>
      _$GetSchoolGroupsIcalUrlRepDtoSerializer();
}

class _$GetSchoolGroupsIcalUrlRepDtoSerializer
    implements PrimitiveSerializer<GetSchoolGroupsIcalUrlRepDto> {
  @override
  final Iterable<Type> types = const [
    GetSchoolGroupsIcalUrlRepDto,
    _$GetSchoolGroupsIcalUrlRepDto
  ];

  @override
  final String wireName = r'GetSchoolGroupsIcalUrlRepDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GetSchoolGroupsIcalUrlRepDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    GetSchoolGroupsIcalUrlRepDto object, {
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
    required GetSchoolGroupsIcalUrlRepDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GetSchoolGroupsIcalUrlRepDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GetSchoolGroupsIcalUrlRepDtoBuilder();
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
