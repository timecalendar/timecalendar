//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'orleans_get_ical_url_from_student_number_dto.g.dart';

/// OrleansGetIcalUrlFromStudentNumberDto
///
/// Properties:
/// * [studentNumber]
abstract class OrleansGetIcalUrlFromStudentNumberDto
    implements
        Built<OrleansGetIcalUrlFromStudentNumberDto,
            OrleansGetIcalUrlFromStudentNumberDtoBuilder> {
  @BuiltValueField(wireName: r'studentNumber')
  String get studentNumber;

  OrleansGetIcalUrlFromStudentNumberDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OrleansGetIcalUrlFromStudentNumberDtoBuilder b) => b;

  factory OrleansGetIcalUrlFromStudentNumberDto(
          [void updates(OrleansGetIcalUrlFromStudentNumberDtoBuilder b)]) =
      _$OrleansGetIcalUrlFromStudentNumberDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<OrleansGetIcalUrlFromStudentNumberDto> get serializer =>
      _$OrleansGetIcalUrlFromStudentNumberDtoSerializer();
}

class _$OrleansGetIcalUrlFromStudentNumberDtoSerializer
    implements StructuredSerializer<OrleansGetIcalUrlFromStudentNumberDto> {
  @override
  final Iterable<Type> types = const [
    OrleansGetIcalUrlFromStudentNumberDto,
    _$OrleansGetIcalUrlFromStudentNumberDto
  ];

  @override
  final String wireName = r'OrleansGetIcalUrlFromStudentNumberDto';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, OrleansGetIcalUrlFromStudentNumberDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'studentNumber')
      ..add(serializers.serialize(object.studentNumber,
          specifiedType: const FullType(String)));
    return result;
  }

  @override
  OrleansGetIcalUrlFromStudentNumberDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = OrleansGetIcalUrlFromStudentNumberDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'studentNumber':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.studentNumber = valueDes;
          break;
      }
    }
    return result.build();
  }
}
