//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'orleans_get_ical_url_from_student_number_dto.g.dart';

/// OrleansGetIcalUrlFromStudentNumberDto
///
/// Properties:
/// * [studentNumber]
@BuiltValue()
abstract class OrleansGetIcalUrlFromStudentNumberDto
    implements
        Built<OrleansGetIcalUrlFromStudentNumberDto,
            OrleansGetIcalUrlFromStudentNumberDtoBuilder> {
  @BuiltValueField(wireName: r'studentNumber')
  String get studentNumber;

  OrleansGetIcalUrlFromStudentNumberDto._();

  factory OrleansGetIcalUrlFromStudentNumberDto(
          [void updates(OrleansGetIcalUrlFromStudentNumberDtoBuilder b)]) =
      _$OrleansGetIcalUrlFromStudentNumberDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrleansGetIcalUrlFromStudentNumberDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrleansGetIcalUrlFromStudentNumberDto> get serializer =>
      _$OrleansGetIcalUrlFromStudentNumberDtoSerializer();
}

class _$OrleansGetIcalUrlFromStudentNumberDtoSerializer
    implements PrimitiveSerializer<OrleansGetIcalUrlFromStudentNumberDto> {
  @override
  final Iterable<Type> types = const [
    OrleansGetIcalUrlFromStudentNumberDto,
    _$OrleansGetIcalUrlFromStudentNumberDto
  ];

  @override
  final String wireName = r'OrleansGetIcalUrlFromStudentNumberDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OrleansGetIcalUrlFromStudentNumberDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'studentNumber';
    yield serializers.serialize(
      object.studentNumber,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OrleansGetIcalUrlFromStudentNumberDto object, {
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
    required OrleansGetIcalUrlFromStudentNumberDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'studentNumber':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.studentNumber = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OrleansGetIcalUrlFromStudentNumberDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OrleansGetIcalUrlFromStudentNumberDtoBuilder();
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
