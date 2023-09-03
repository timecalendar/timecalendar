//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_calendar_rep_dto.g.dart';

/// CreateCalendarRepDto
///
/// Properties:
/// * [token]
@BuiltValue()
abstract class CreateCalendarRepDto
    implements Built<CreateCalendarRepDto, CreateCalendarRepDtoBuilder> {
  @BuiltValueField(wireName: r'token')
  String get token;

  CreateCalendarRepDto._();

  factory CreateCalendarRepDto([void updates(CreateCalendarRepDtoBuilder b)]) =
      _$CreateCalendarRepDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateCalendarRepDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateCalendarRepDto> get serializer =>
      _$CreateCalendarRepDtoSerializer();
}

class _$CreateCalendarRepDtoSerializer
    implements PrimitiveSerializer<CreateCalendarRepDto> {
  @override
  final Iterable<Type> types = const [
    CreateCalendarRepDto,
    _$CreateCalendarRepDto
  ];

  @override
  final String wireName = r'CreateCalendarRepDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateCalendarRepDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateCalendarRepDto object, {
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
    required CreateCalendarRepDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateCalendarRepDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateCalendarRepDtoBuilder();
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
