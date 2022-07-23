//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_calendar_rep_dto.g.dart';

/// CreateCalendarRepDto
///
/// Properties:
/// * [id]
abstract class CreateCalendarRepDto
    implements Built<CreateCalendarRepDto, CreateCalendarRepDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  CreateCalendarRepDto._();

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateCalendarRepDtoBuilder b) => b;

  factory CreateCalendarRepDto([void updates(CreateCalendarRepDtoBuilder b)]) =
      _$CreateCalendarRepDto;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateCalendarRepDto> get serializer =>
      _$CreateCalendarRepDtoSerializer();
}

class _$CreateCalendarRepDtoSerializer
    implements StructuredSerializer<CreateCalendarRepDto> {
  @override
  final Iterable<Type> types = const [
    CreateCalendarRepDto,
    _$CreateCalendarRepDto
  ];

  @override
  final String wireName = r'CreateCalendarRepDto';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, CreateCalendarRepDto object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    result
      ..add(r'id')
      ..add(serializers.serialize(object.id,
          specifiedType: const FullType(String)));
    return result;
  }

  @override
  CreateCalendarRepDto deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = CreateCalendarRepDtoBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current as String;
      iterator.moveNext();
      final Object? value = iterator.current;

      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String;
          result.id = valueDes;
          break;
      }
    }
    return result.build();
  }
}
